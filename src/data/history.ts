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
 * Areas owned by commands so far:
 * - Project settings (setProjectSetting entries). Restoring a snapshot keeps
 *   the current settings.
 *
 * History belongs to the project window. Other windows (e.g. project settings)
 * get a copy of the store, history included, through "editor-store-updated".
 * Each entry records the window it came from (`source`): the settings window
 * only undoes and redoes its own entries (see settingsUndo.ts), so it never
 * changes something that isn't on screen. The project window steps through
 * everything.
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
import structuredClone from "@ungap/structured-clone";
import {
  AnyNode,
  HistoryEntry,
  HistorySource,
  Project,
  ProjectHistory,
  SnapshotHistoryEntry,
  Store,
  UpdateFunction,
} from "../typings";
import { setProjectSetting, settingValuesEqual } from "./projectSettings";
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
  pushHistory(createSnapshotEntry(source));
}

/**
 * Save the project's current state as a snapshot, and return an entry for it
 * (to push, or include in a group). Push it before anything else is recorded.
 */
export function createSnapshotEntry(
  source: HistorySource
): SnapshotHistoryEntry {
  const store = getStore();
  const versionId = uuidv4();
  writeSnapshot(store, versionId);
  return {
    id: uuidv4(),
    kind: "snapshot",
    source,
    before: currentSnapshot(store.history),
    after: versionId,
  };
}

// The last entry pushed with `merge`, if nothing's happened since
let lastMergeable: { id: string; time: number } | null = null;
// How long after a mergeable change the next one can merge into it
const MERGE_WINDOW_MS = 1000;

/**
 * Add an entry for a change that's already been applied to the project,
 * discarding any entries that could have been redone.
 *
 * With `merge`, a setting change merges into the previous entry if that was
 * a mergeable change to the same setting, made within the last second. Use
 * this for controls that change continuously (typing, spinner buttons), so
 * each burst of changes is one undo step.
 */
export function pushHistory(
  entry: HistoryEntry,
  options: { merge?: boolean } = {}
) {
  const store = getStore();
  const history = store.history;
  const now = Date.now();
  const top = history.entries[history.location - 1];
  if (
    options.merge &&
    top &&
    history.location === history.entries.length &&
    lastMergeable?.id === top.id &&
    now - lastMergeable.time < MERGE_WINDOW_MS &&
    top.kind === "setProjectSetting" &&
    entry.kind === "setProjectSetting" &&
    top.key === entry.key
  ) {
    top.after = entry.after;
    // A new ID, since the state it represents changed
    top.id = uuidv4();
    if (settingValuesEqual(top.before, top.after)) {
      // Changed back: nothing left to undo
      history.entries.pop();
      history.location = history.entries.length;
      lastMergeable = null;
    } else {
      lastMergeable = { id: top.id, time: now };
    }
  } else {
    history.entries.length = history.location;
    history.entries.push(entry);
    history.location = history.entries.length;
    lastMergeable = options.merge ? { id: entry.id, time: now } : null;
  }
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
    const snapshot = lastSnapshotIn(history.entries[i]);
    if (snapshot) return snapshot;
  }
  return history.baseline;
}

function lastSnapshotIn(entry: HistoryEntry): string | undefined {
  switch (entry.kind) {
    case "snapshot":
      return entry.after;
    case "group":
      for (let i = entry.entries.length - 1; i >= 0; i--) {
        const snapshot = lastSnapshotIn(entry.entries[i]);
        if (snapshot) return snapshot;
      }
      return undefined;
    case "setProjectSetting":
      return undefined;
  }
}

/*
 * Undo and redo
 */

export type Direction = "undo" | "redo";

/**
 * Whether undo can do anything: in a text field, or with an entry to undo.
 * With `source`, only entries from that window count.
 */
export function canUndo(source?: HistorySource) {
  return inTextElement() || canStep("undo", source);
}

/**
 * Whether redo can do anything: in a text field, or with an entry to redo.
 * With `source`, only entries from that window count.
 */
export function canRedo(source?: HistorySource) {
  return inTextElement() || canStep("redo", source);
}

/** Whether there's a history entry to undo or redo (from `source`, if given) */
export function canStep(undoOrRedo: Direction, source?: HistorySource) {
  const entry = nextEntry(getStore().history, undoOrRedo);
  return entry !== undefined && (source === undefined || entry.source === source);
}

function nextEntry(history: ProjectHistory, undoOrRedo: Direction) {
  return history.entries[
    undoOrRedo === "undo" ? history.location - 1 : history.location
  ];
}

// Steps run one at a time, so a quick series of undos each starts from where
// the last one left off
let stepQueue: Promise<void> = Promise.resolve();

export function handleUndoRedo(undoOrRedo: Direction, update: UpdateFunction) {
  // First, see if we need to treat this like a regular text edit undo/redo
  if (inTextElement() === true) {
    // Rich text fields keep their own history
    if (richTextUndoRedo(undoOrRedo)) return;
    // TODO: execCommand is deprecated in the HTML spec but remains supported in WKWebView.
    // Replace with a custom per-element undo stack if this ever breaks.
    document.execCommand(undoOrRedo);
    return;
  }
  stepProjectHistory(undoOrRedo, update);
}

/**
 * Undo or redo in project history (not in a text field). With `source`, only
 * steps if the entry came from that window.
 */
export function stepProjectHistory(
  undoOrRedo: Direction,
  update: UpdateFunction,
  source?: HistorySource
) {
  stepQueue = stepQueue
    .then(() => stepHistory(undoOrRedo, update, source))
    .catch((error) => console.error(`Couldn't ${undoOrRedo}:`, error));
}

async function stepHistory(
  undoOrRedo: Direction,
  update: UpdateFunction,
  source?: HistorySource
) {
  const history = getStore().history;
  const location = history.location;
  const index = undoOrRedo === "undo" ? location - 1 : location;
  const entry = history.entries[index];
  if (!entry) return;
  // Checked here, not when asked, since earlier queued steps move location
  if (source !== undefined && entry.source !== source) return;
  /*
  // NOTE: This is marks the document as unedited if you go to the beginning of history. The idea is that if you made a bunch of changes and then backed all the way up, it should mark the document as unedited.
  // BUT: That's not tenable if you saved the document and THEN backed all the way up to the beginning. It'd technically be a different version than what you saved, which is no good.
  // So, commenting this out for now, with the hope that I'll find a way to handle it. Maybe comparing the saved version to the one at index 0?
  if (location === 0) {
    emit("set-document-edited", { state: false });
  }
  */
  // Load any snapshots first, since that waits on the backend
  const snapshots = new Map<string, Project>();
  await loadSnapshotsFor(entry, undoOrRedo, snapshots);
  // (Compare by ID: getStore() returns a copy, so entries are never the same
  // object between reads)
  const store = getStore();
  if (
    store.history.location !== location ||
    store.history.entries[index]?.id !== entry.id
  ) {
    // Something was recorded in the meantime, so this step no longer applies
    console.warn(`History changed during ${undoOrRedo}; skipped.`);
    return;
  }
  store.project = applyEntry(entry, undoOrRedo, store.project, snapshots);
  store.history.location = undoOrRedo === "undo" ? index : index + 1;
  lastMergeable = null;
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

/** The order to step through a group's entries */
function inOrder(entries: Array<HistoryEntry>, undoOrRedo: Direction) {
  return undoOrRedo === "undo" ? [...entries].reverse() : entries;
}

async function loadSnapshotsFor(
  entry: HistoryEntry,
  undoOrRedo: Direction,
  snapshots: Map<string, Project>
) {
  switch (entry.kind) {
    case "snapshot": {
      const versionId = undoOrRedo === "undo" ? entry.before : entry.after;
      snapshots.set(versionId, await loadSnapshot(versionId));
      break;
    }
    case "group":
      for (const child of inOrder(entry.entries, undoOrRedo)) {
        await loadSnapshotsFor(child, undoOrRedo, snapshots);
      }
      break;
    case "setProjectSetting":
      break;
  }
}

/** Undo or redo an entry, returning the resulting project */
function applyEntry(
  entry: HistoryEntry,
  undoOrRedo: Direction,
  project: Project,
  snapshots: Map<string, Project>
): Project {
  switch (entry.kind) {
    case "snapshot": {
      const versionId = undoOrRedo === "undo" ? entry.before : entry.after;
      const snapshot = snapshots.get(versionId);
      if (!snapshot) throw new Error(`History version ${versionId} not loaded`);
      // Settings belong to setting commands, so keep them as they are
      return { ...snapshot, settings: project.settings };
    }
    case "setProjectSetting":
      setProjectSetting(
        project.settings,
        entry.key,
        structuredClone(undoOrRedo === "undo" ? entry.before : entry.after)
      );
      return project;
    case "group":
      return inOrder(entry.entries, undoOrRedo).reduce(
        (result, child) => applyEntry(child, undoOrRedo, result, snapshots),
        project
      );
  }
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
export function syncSettingsWindow(store: Store) {
  emitTo(
    getProjectWindowLabel(store.projectPath, "settings"),
    "editor-store-updated",
    stringify(store)
  );
}
