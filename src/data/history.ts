import { v4 as uuidv4 } from "uuid";
import { emit, once } from "@tauri-apps/api/event";
import { resolve, appCacheDir } from "@tauri-apps/api/path";
import { stringify } from "../utils/stringify";
import inTextElement from "../utils/inTextElement";
import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../data/dataStore";
import markUnsaved from "./markUnsaved";
import { getNode } from "./getData";
import { AnyNode } from "../typings";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";

/**
 * Create a history instance.
 */
export async function saveHistoryVersion(initial: boolean = false) {
  const store = getStore();
  const versionId = uuidv4();
  // Update history object
  const projectHistory = store.history;
  const historyIndex = initial === true ? 0 : projectHistory.location + 1;
  projectHistory.versions.length = historyIndex;
  projectHistory.versions.push(versionId);
  projectHistory.location = historyIndex;
  setStore(store);
  if (initial === false) {
    markUnsaved();
  }
  // Write to fs
  const cacheBase = await appCacheDir();
  const cachePath = await resolve(
    cacheBase,
    "Projects",
    store.project.id,
    "undo"
  );
  emit("save-text-file", {
    name: versionId,
    contents: stringify(store.project),
    path: cachePath,
    label: getProjectWindowLabel(store.projectPath),
  });
}

/**
 * Determine if, based on the project history and text field focus, if we can undo — move backward in the project history.
 */
export function canUndo() {
  const store = getStore();
  const history = store.history;
  if (history.location === 0 && inTextElement() === false) {
    return false;
  }
  return true;
}

/**
 * Determine if, based on the project history and text field focus, if we can redo — move forward the project history.
 */
export function canRedo() {
  const store = getStore();
  const history = store.history;
  if (
    history.location === history.versions.length - 1 &&
    inTextElement() === false
  ) {
    return false;
  }
  return true;
}

export async function handleUndoRedo(undoOrRedo: string, update: Function) {
  // Get project history
  const store = getStore();
  const viewStore = getViewStore();
  const projectHistory = store.history;
  const stepIndex =
    undoOrRedo === "undo"
      ? projectHistory.location - 1
      : projectHistory.location + 1;
  if (stepIndex < 0) {
    console.error("Can't go back further in history.");
    return;
  }
  /*
  // NOTE: This is marks the document as unedited if you go to the beginning of history. The idea is that if you made a bunch of changes and then backed all the way up, it should mark the document as unedited.
  // BUT: That's not tenable if you saved the document and THEN backed all the way up to the beginning. It'd technically be a different version than what you saved, which is no good.
  // So, commenting this out for now, with the hope that I'll find a way to handle it. Maybe comparing the saved version to the one at index 0?
  if (stepIndex === 0) {
    emit("set-document-edited", { state: false });
  }
  */
  const stepVersion = projectHistory.versions[stepIndex];
  const cacheBase = await appCacheDir();
  const versionPath = await resolve(
    cacheBase,
    "Projects",
    store.project.id,
    "undo",
    stepVersion
  );
  emit("request-history-version", {
    versionPath: versionPath,
    versionId: stepVersion,
    label: getProjectWindowLabel(store.projectPath),
  });
  // Listen to receive it
  once(
    "receive-history-version",
    (event: { payload: { version_id: string; message: string } }) => {
      // No longer needed since window is now identified in Rust
      // const focused = await appWindow.isFocused();
      // if (focused === false) return;
      const payload = event.payload;
      if (payload.version_id !== stepVersion) {
        return;
      }
      const historyVersion = JSON.parse(payload.message);
      store.project = historyVersion;
      store.history = {
        location: stepIndex,
        versions: projectHistory.versions,
      };
      // See if selected nodes need to be updated
      const newSelectedNodes: Array<AnyNode> = [];
      viewStore.selectedNodes.forEach((node) => {
        const existingNode: AnyNode | undefined = getNode(node.id, store);
        if (existingNode) {
          newSelectedNodes.push(node);
        }
      });
      viewStore.selectedNodes = newSelectedNodes;
      // Handle final calls
      markUnsaved();
      setStore(store);
      setViewStore(viewStore);
      update(false);
    }
  );
}
