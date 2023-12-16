import { v4 as uuidv4 } from "uuid";
import { emit, once } from "@tauri-apps/api/event";
import { resolve } from "@tauri-apps/api/path";
import { appWindow } from "@tauri-apps/api/window";
import inTextElement from "../utils/inTextElement";
import { getStore, setStore } from "../data/dataStore";
import markUnsaved from "./markUnsaved";

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
  emit("save-text-file", {
    name: versionId,
    contents: JSON.stringify(store.project, null, 2),
    projectPath: await resolve(store.projectPath, "undo"),
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
  const versionPath: string = await resolve(
    store.projectPath,
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
      setStore(store);
      markUnsaved();
      update(false);
    }
  );
}

export { saveHistoryVersion, handleUndoRedo, canUndo, canRedo };
