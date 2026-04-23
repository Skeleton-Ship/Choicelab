import { emit } from "@tauri-apps/api/event";
import playerHTMLDefault from "@surfgreen/choicelab-player-html5/dist/index.html?raw";
import { getStore } from "../data/dataStore";
import { resolveAssetsForPlayer } from "../preview/resolveAssetsForPlayer";
import { writeFontsToDir } from "../preview/updatePreviewFonts";
import { patchPlayerHTML, playerCSSDefault, playerJSDefault, getBackgroundColor } from "./createWebDir";
import { stringify } from "../utils/stringify";
import { slugify } from "../utils/slugify";

export function getExportDirName(projectName: string): string {
  return slugify(projectName);
}

export async function exportProject(exportDir: string): Promise<void> {
  const store = getStore();

  emit("save-text-file", { name: "index.html", contents: patchPlayerHTML(playerHTMLDefault, getBackgroundColor()), path: exportDir });
  emit("save-text-file", { name: "choicelab.css", contents: playerCSSDefault, path: exportDir });
  emit("save-text-file", { name: "choicelab.js", contents: playerJSDefault, path: exportDir });

  const playerProject = resolveAssetsForPlayer(store.project);
  emit("export-project", {
    projectPath: store.projectPath,
    projectData: stringify(playerProject),
    exportDir,
  });

  await writeFontsToDir(exportDir);
}
