import { emit } from "@tauri-apps/api/event";
import { getStore } from "../data/dataStore";

export async function startPreview() {
  const store = getStore();
  const projectPath = store.projectPath;
  emit("launch-preview", {
    projectPath: projectPath,
  });
}
