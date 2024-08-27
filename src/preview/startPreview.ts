import { resolve, appCacheDir } from "@tauri-apps/api/path";
import { emit } from "@tauri-apps/api/event";
import { getStore } from "../data/dataStore";

export async function startPreview() {
  const store = getStore();
  const projectPath = store.projectPath;
  const cacheBase = await appCacheDir();
  const cachePath = await resolve(
    cacheBase,
    "Projects",
    store.project.id,
    "Preview"
  );
  emit("start-preview", {
    cachePath: cachePath,
    projectPath: projectPath,
  });
}
