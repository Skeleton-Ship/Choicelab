/*
 * Project undo history
 *
 * History is a stack of entries (see ProjectHistory in typings.ts), each one
 * change that can be undone and redone. `location` counts the applied entries:
 * undo reverses the entry before it, redo reapplies the entry at it.
 *
 * Entries were originally all whole-project snapshots. The plan is to move
 * to commands that record only what changed, one area of the project at a
 * time, with each area owned by exactly one model. Snapshot entries are one
 * kind of entry, so both kinds share the same stack.
 *
 * History belongs to the project window. Other windows (e.g. project settings)
 * get a copy of the store, history included, through "editor-store-updated".
 */

import { v4 as uuidv4 } from "uuid";
import { emit, emitTo, listen, UnlistenFn } from "@tauri-apps/api/event";
import { stringify } from "../utils/stringify";
import inTextElement from "../utils/inTextElement";
import { richTextUndoRedo } from "../editor/richText/activeRichTextEditor";
import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../data/dataStore";
import markUnsaved from "./markUnsaved";
import { triggerAutosave } from "../fs/autosave";
import { getProjectCachePath, writeProjectCacheFile } from "../fs/projectCache";
import { clearWriteFailure, reportWriteFailure } from "../errors/writeFailures";
import { getNode } from "./getData";
import {
  AnyNode,
  HistoryEntry,
  HistorySource,
  Project,
  ProjectHistory,
  Store,
  UpdateFunction,
} from "../typings";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";

/*
 * Recording
 */

/**
 * Start history for a newly opened project, saving its current state as the
 * baseline snapshot.
 */
export function initHistory() {
  const store = getStore();
  const versionId = uuidv4();
  store.history = { baseline: versionId, entries: [], location: 0 };
  setStore(store);
  writeSnapshot(store, versionId);
  syncSettingsWindow(store);
}

/**
 * Record the project's current state as a snapshot entry. Call after changing
 * the project.
 */
export function recordSnapshot(source: HistorySource = "editor") {
  const store = getStore();
  const versionId = uuidv4();
  pushHistory({
    id: uuidv4(),
    kind: "snapshot",
    source,
    before: currentSnapshot(store.history),
    after: versionId,
  });
  writeSnapshot(store, versionId);
}

/**
 * Add an entry for a change that's already been applied to the project,
 * discarding any entries that could have been redone.
 */
function pushHistory(entry: HistoryEntry) {
  const store = getStore();
  const history = store.history;
  history.entries.length = history.location;
  history.entries.push(entry);
  history.location = history.entries.length;
  setStore(store);
  markUnsaved();
  triggerAutosave();
  syncSettingsWindow(store);
}

/**
 * The ID of the history state currently shown, to tell if the project has
 * changed since (e.g. during a save).
 */
export function currentHistoryId(): string {
  const history = getStore().history;
  return history.location === 0
    ? history.baseline
    : history.entries[history.location - 1].id;
}

/** The latest applied snapshot: the project state snapshot entries build on */
function currentSnapshot(history: ProjectHistory): string {
  for (let i = history.location - 1; i >= 0; i--) {
    const entry = history.entries[i];
    if (entry.kind === "snapshot") return entry.after;
  }
  return history.baseline;
}

/*
 * Undo and redo
 */

/**
 * Determine if, based on the project history and text field focus, if we can undo — move backward in the project history.
 */
export function canUndo() {
  const history = getStore().history;
  return history.location > 0 || inTextElement();
}

/**
 * Determine if, based on the project history and text field focus, if we can redo — move forward the project history.
 */
export function canRedo() {
  const history = getStore().history;
  return history.location < history.entries.length || inTextElement();
}

// Steps run one at a time, so a quick series of undos each starts from where
// the last one left off
let stepQueue: Promise<void> = Promise.resolve();

export function handleUndoRedo(
  undoOrRedo: "undo" | "redo",
  update: UpdateFunction
) {
  // First, see if we need to treat this like a regular text edit undo/redo
  if (inTextElement() === true) {
    // Rich text fields keep their own history
    if (richTextUndoRedo(undoOrRedo)) return;
    // TODO: execCommand is deprecated in the HTML spec but remains supported in WKWebView.
    // Replace with a custom per-element undo stack if this ever breaks.
    document.execCommand(undoOrRedo);
    return;
  }
  stepQueue = stepQueue
    .then(() => stepHistory(undoOrRedo, update))
    .catch((error) => console.error(`Couldn't ${undoOrRedo}:`, error));
}

async function stepHistory(undoOrRedo: "undo" | "redo", update: UpdateFunction) {
  const history = getStore().history;
  const entry =
    undoOrRedo === "undo"
      ? history.entries[history.location - 1]
      : history.entries[history.location];
  if (!entry) return;
  /*
  // NOTE: This is marks the document as unedited if you go to the beginning of history. The idea is that if you made a bunch of changes and then backed all the way up, it should mark the document as unedited.
  // BUT: That's not tenable if you saved the document and THEN backed all the way up to the beginning. It'd technically be a different version than what you saved, which is no good.
  // So, commenting this out for now, with the hope that I'll find a way to handle it. Maybe comparing the saved version to the one at index 0?
  if (location === 0) {
    emit("set-document-edited", { state: false });
  }
  */
  // Apply the entry. Re-read the store afterward, since loading a snapshot
  // waits on the backend.
  let project: Project | undefined;
  switch (entry.kind) {
    case "snapshot":
      project = await loadSnapshot(
        undoOrRedo === "undo" ? entry.before : entry.after
      );
      break;
  }
  const store = getStore();
  if (project) store.project = project;
  store.history.location += undoOrRedo === "undo" ? -1 : 1;
  // Deselect nodes that no longer exist
  const viewStore = getViewStore();
  viewStore.selectedNodes = viewStore.selectedNodes.filter(
    (node: AnyNode) => getNode(node.id, store) !== undefined
  );
  // Handle final calls
  markUnsaved();
  setStore(store);
  setViewStore(viewStore);
  syncSettingsWindow(store);
  update(false);
}

/*
 * Snapshot storage (in the project's cache folder, via the backend)
 */

function writeSnapshot(store: Store, versionId: string) {
  writeProjectCacheFile(
    store.projectPath,
    versionId,
    stringify(store.project),
    "History"
  ).then(
    () => clearWriteFailure("history"),
    (error) => {
      // Undo can't reach this version without it
      console.error("Undo history couldn't be saved:", error);
      reportWriteFailure("history", error, store.project.name);
    }
  );
}

async function loadSnapshot(versionId: string): Promise<Project> {
  const store = getStore();
  const versionPath = await getProjectCachePath(
    store.projectPath,
    "History",
    versionId
  );
  // The backend broadcasts its response, so wait for this version's, and give
  // up if none comes (e.g. the file couldn't be read), so later steps can run
  let unlisten: UnlistenFn | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  try {
    return await new Promise<Project>((resolve, reject) => {
      timeout = setTimeout(
        () => reject(new Error(`No response for history version ${versionId}`)),
        SNAPSHOT_TIMEOUT_MS
      );
      // Register listener before emitting to avoid dropping a fast response
      listen<{ version_id: string; message: string }>(
        "receive-history-version",
        (event) => {
          if (event.payload.version_id !== versionId) return;
          try {
            resolve(JSON.parse(event.payload.message));
          } catch (error) {
            reject(error);
          }
        }
      ).then((fn) => {
        // Already timed out
        if (settled) return fn();
        unlisten = fn;
        emit("request-history-version", {
          versionPath: versionPath,
          versionId: versionId,
          label: getProjectWindowLabel(store.projectPath),
        });
      }, reject);
    });
  } finally {
    settled = true;
    clearTimeout(timeout);
    unlisten?.();
  }
}

const SNAPSHOT_TIMEOUT_MS = 10000;

/*
 * Other windows
 */

/** Send the store to the project settings window, if it's open */
function syncSettingsWindow(store: Store) {
  emitTo(
    getProjectWindowLabel(store.projectPath, "settings"),
    "editor-store-updated",
    stringify(store)
  );
}
