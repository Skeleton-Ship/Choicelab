import { emit } from "@tauri-apps/api/event";
import playerHTMLDefault from "@surfgreen/choicelab-player-html5/dist/index.html?raw";
import playerCSSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.css?raw";
import playerJSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.js?raw";
import { appCacheDir, resolve } from "@tauri-apps/api/path";
import { updatePreviewFonts } from "../preview/updatePreviewFonts";
import { getStore } from "../data/dataStore";
import { getPlayerSettings } from "../data/getData";

export function getBackgroundColor(): string | undefined {
  const appearance = getPlayerSettings(getStore(), "appearance");
  if (appearance?.background?.kind === "color") {
    return appearance.background.color as string;
  }
  return undefined;
}

export function patchPlayerHTML(html: string, backgroundColor?: string): string {
  let patched = html
    .replace("logging: true", "logging: false")
    .replace(/path: "(.*?)",/g, `path: "./project/project.json",`)
    .replace(
      '<link id="player-fonts" data-href="./fonts.css" />',
      '<link id="player-fonts" rel="stylesheet" href="./fonts.css" />'
    );
  if (backgroundColor) {
    patched = patched.replace(
      '<link rel="stylesheet" type="text/css" href="./choicelab.css" />',
      `<link rel="stylesheet" type="text/css" href="./choicelab.css" />\n    <style>:root { --cl-background-color: ${backgroundColor}; }</style>`
    );
  }
  return patched;
}

export { playerCSSDefault, playerJSDefault };
export { playerHTMLDefault };

export async function createWebDir(label: string) {
  const previewPath = await resolve(
    await appCacheDir(),
    "Projects",
    label,
    "Preview"
  );
  emit("save-text-file", { name: "index.html", contents: patchPlayerHTML(playerHTMLDefault, getBackgroundColor()), path: previewPath, label });
  emit("save-text-file", { name: "choicelab.css", contents: playerCSSDefault, path: previewPath, label });
  emit("save-text-file", { name: "choicelab.js", contents: playerJSDefault, path: previewPath, label });
  await updatePreviewFonts();
}
