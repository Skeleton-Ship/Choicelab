import { emit } from "@tauri-apps/api/event";
import playerHTMLDefault from "@surfgreen/choicelab-player-html5/dist/index.html?raw";
import playerCSSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.css?raw";
import playerJSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.js?raw";
import { appCacheDir, resolve } from "@tauri-apps/api/path";

export async function createWebDir(label: string) {
  const previewPath = await resolve(
    await appCacheDir(),
    "Projects",
    label,
    "Preview"
  );
  emit("save-text-file", {
    name: "index.html",
    contents: playerHTMLDefault,
    path: previewPath,
    label: label,
  });
  emit("save-text-file", {
    name: "choicelab.css",
    contents: playerCSSDefault,
    path: previewPath,
    label: label,
  });
  emit("save-text-file", {
    name: "choicelab.js",
    contents: playerJSDefault,
    path: previewPath,
    label: label,
  });
}
