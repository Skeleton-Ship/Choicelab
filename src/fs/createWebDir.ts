import { emit } from "@tauri-apps/api/event";
import playerHTMLDefault from "@surfgreen/choicelab-player-html5/dist/index.html?raw";
import playerCSSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.css?raw";
import playerJSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.js?raw";
import { appCacheDir, resolve } from "@tauri-apps/api/path";
import { updatePreviewFonts } from "../preview/updatePreviewFonts";

export function patchPlayerHTML(html: string): string {
  return html
    .replace("logging: true", "logging: false")
    .replace(/path: "(.*?)",/g, `path: "./project/project.json",`)
    .replace(
      '<link id="player-fonts" data-href="./fonts.css" />',
      '<link id="player-fonts" rel="stylesheet" href="./fonts.css" />'
    );
}

export { playerCSSDefault, playerJSDefault };

export async function createWebDir(label: string) {
  const previewPath = await resolve(
    await appCacheDir(),
    "Projects",
    label,
    "Preview"
  );
  emit("save-text-file", { name: "index.html", contents: patchPlayerHTML(playerHTMLDefault), path: previewPath, label });
  emit("save-text-file", { name: "choicelab.css", contents: playerCSSDefault, path: previewPath, label });
  emit("save-text-file", { name: "choicelab.js", contents: playerJSDefault, path: previewPath, label });
  await updatePreviewFonts();
}
