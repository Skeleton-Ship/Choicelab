import { v4 as uuidv4 } from "uuid";
import { emit, once } from "@tauri-apps/api/event";
import { resolve, appCacheDir } from "@tauri-apps/api/path";
import { appWindow } from "@tauri-apps/api/window";
import { stringify } from "../utils/stringify";
import inTextElement from "../utils/inTextElement";
import { getStore, setStore } from "../data/dataStore";
import markUnsaved from "./markUnsaved";
import { getNode } from "./getData";
import { AnyNode } from "../typings";

/**
 * Create a history instance.
 */
async function saveHistoryVersion(initial: boolean = false) {
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
  });
}

/**
 * Determine if, based on the project history and text field focus, if we can undo — move backward in the project history.
 */
function canUndo() {
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
function canRedo() {
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

async function handleUndoRedo(undoOrRedo: string, update: Function) {
  // Get project history
  const store = getStore();
  const projectHistory = store.history;
  const stepIndex =
    undoOrRedo === "undo"
      ? projectHistory.location - 1
      : projectHistory.location + 1;
  if (stepIndex < 0) {
    console.error("Can't go back further in history.");
    return;
  }
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
  });
  // Listen to receive it
  once(
    "receive-history-version",
    async (event: { payload: { message: string } }) => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const payload = event.payload;
      const historyVersion = JSON.parse(payload.message);
      store.project = historyVersion;
      store.history = {
        location: stepIndex,
        versions: projectHistory.versions,
      };
      // See if selected nodes need to be updated
      const newSelectedNodes: Array<AnyNode> = [];
      store.selectedNodes.forEach((node) => {
        const existingNode: AnyNode | undefined = getNode(node.id, store);
        if (existingNode) {
          newSelectedNodes.push(node);
        }
      });
      store.selectedNodes = newSelectedNodes;
      // Handle final calls
      markUnsaved();
      setStore(store);
      update(false);
    }
  );
}

export { saveHistoryVersion, handleUndoRedo, canUndo, canRedo };
