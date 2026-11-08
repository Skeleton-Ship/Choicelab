import { getStore } from "../data/dataStore";
import { stringify } from "../utils/stringify";
import { writeProjectCacheFile } from "./projectCache";
import { getFileErrorText } from "./fileErrorText";

let lastAutosaveTime = 0;

export async function triggerAutosave() {
  const now = Date.now();
  if (now - lastAutosaveTime < 30_000) return;
  lastAutosaveTime = now;
  const store = getStore();
  try {
    await writeProjectCacheFile(
      store.projectPath,
      "autosave.clx",
      stringify(store.project)
    );
  } catch (error) {
    // Let the next edit try again instead of waiting out the interval
    lastAutosaveTime = 0;
    // TODO: show this to the user (e.g. a persistent banner) instead of logging
    const text = getFileErrorText(error, store.project.name);
    console.error(`Autosave failed: ${text.title} ${text.body}`, error);
  }
}
