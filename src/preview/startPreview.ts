import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getStore } from "../data/dataStore";
import { updatePreview } from "./updatePreview";

export async function startPreview() {
  const store = getStore();
  updatePreview();
  let previewWindow = await WebviewWindow.getByLabel("preview");
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
