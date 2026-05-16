import { emit } from "@tauri-apps/api/event";
import { resolve, appCacheDir } from "@tauri-apps/api/path";
import { getStore } from "../data/dataStore";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { stringify } from "../utils/stringify";

let lastAutosaveTime = 0;

export async function triggerAutosave() {
  const now = Date.now();
  if (now - lastAutosaveTime < 30_000) return;
  lastAutosaveTime = now;
  const store = getStore();
  const cacheBase = await appCacheDir();
  const cachePath = await resolve(
    cacheBase,
    "Projects",
    getProjectWindowLabel(store.projectPath)
  );
  emit("save-text-file", {
    name: "autosave.clx",
    contents: stringify(store.project),
    path: cachePath,
    label: getProjectWindowLabel(store.projectPath),
  });
}
