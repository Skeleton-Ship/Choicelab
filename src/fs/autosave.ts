import { getStore } from "../data/dataStore";
import { stringify } from "../utils/stringify";
import { writeProjectCacheFile } from "./projectCache";
import { getFileErrorText } from "./fileErrorText";

/** At most one autosave per this many milliseconds. */
const AUTOSAVE_INTERVAL_MS = 30_000;

let lastAutosaveTime = 0;
let pendingAutosave: ReturnType<typeof setTimeout> | undefined;

/**
 * Autosave after an edit. The first edit is saved right away; edits within
 * the next 30 seconds are saved together at the end of that interval, so the
 * autosave is never more than 30 seconds behind.
 */
export function triggerAutosave() {
  // A save is already scheduled, and it'll write the latest state
  if (pendingAutosave !== undefined) return;
  const wait = Math.max(0, lastAutosaveTime + AUTOSAVE_INTERVAL_MS - Date.now());
  pendingAutosave = setTimeout(() => {
    pendingAutosave = undefined;
    void writeAutosave();
  }, wait);
}

/**
 * Save now, without waiting for the interval (e.g. after a crash). Resolves to
 * whether it worked.
 */
export function flushAutosave(): Promise<boolean> {
  cancelAutosave();
  return writeAutosave();
}

/** Drop a scheduled autosave (e.g. when the project closes normally). */
export function cancelAutosave() {
  if (pendingAutosave !== undefined) {
    clearTimeout(pendingAutosave);
    pendingAutosave = undefined;
  }
}

async function writeAutosave(): Promise<boolean> {
  lastAutosaveTime = Date.now();
  let projectName = "";
  try {
    // Read the store at write time, so the latest edits are included. This is
    // inside the try, since after a crash the store itself may be the problem.
    const store = getStore();
    projectName = store.project.name;
    await writeProjectCacheFile(
      store.projectPath,
      "autosave.clx",
      stringify(store.project)
    );
    return true;
  } catch (error) {
    // Let the next edit try again instead of waiting out the interval
    lastAutosaveTime = 0;
    // TODO: show this to the user (e.g. a persistent banner) instead of logging
    const text = getFileErrorText(error, projectName);
    console.error(`Autosave failed: ${text.title} ${text.body}`, error);
    return false;
  }
}
