import { emit } from "@tauri-apps/api/event";
import { getStore } from "../data/dataStore";
import { WebviewWindow } from "@tauri-apps/api/window";

export async function startPreview() {
  const store = getStore();
  const projectPath = store.projectPath;
  emit("update-preview", {
    projectPath: projectPath,
  });
  let previewWindow = WebviewWindow.getByLabel("preview");
  const hash = Date.now();
  if (!previewWindow) {
    previewWindow = new WebviewWindow("preview", {
      url: `http://localhost:4091?${hash}`,
      title: `${store.project.name} – Preview`,
    });
  } else {
    previewWindow.setFocus();
  }
}
