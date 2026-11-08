import { invoke } from "@tauri-apps/api/core";
import { basename } from "@tauri-apps/api/path";
import { message } from "@tauri-apps/plugin-dialog";
import playerHTMLDefault from "@surfgreen/choicelab-player-html5/dist/index.html?raw";
import { getStore } from "../data/dataStore";
import { resolveAssetsForPlayer } from "../preview/resolveAssetsForPlayer";
import { writeFontsToDir } from "../preview/updatePreviewFonts";
import { patchPlayerHTML, playerCSSDefault, playerJSDefault, getBackgroundColor } from "./createWebDir";
import { stringify } from "../utils/stringify";
import { slugify } from "../utils/slugify";
import { getDialogText } from "../utils/dialogText";
import { showFileErrorMessage } from "./saveErrorDialog";

export function getExportDirName(projectName: string): string {
  return slugify(projectName);
}

/** Export the project for the web into `exportDir`, telling the author if it fails. */
export async function exportProject(exportDir: string): Promise<void> {
  const store = getStore();
  const folderName = await basename(exportDir);
  let failedFonts: string[];
  try {
    await invoke("export_project", {
      projectPath: store.projectPath,
      projectData: stringify(resolveAssetsForPlayer(store.project)),
      exportDir,
      files: [
        { name: "index.html", contents: patchPlayerHTML(playerHTMLDefault, getBackgroundColor()) },
        { name: "choicelab.css", contents: playerCSSDefault },
        { name: "choicelab.js", contents: playerJSDefault },
      ],
    });
    failedFonts = await writeFontsToDir(exportDir);
  } catch (error) {
    await showFileErrorMessage(error, folderName, "Couldn't export project");
    return;
  }
  if (failedFonts.length > 0) {
    // The export works, but will show substitute fonts
    const dialog = getDialogText(
      "Some fonts are missing",
      "Some fonts couldn't be included in the export.",
      `The exported project will use substitute fonts instead of ${failedFonts.join(", ")}. Check your internet connection, then export again.`
    );
    await message(dialog.message, { title: dialog.title, kind: "warning" });
  }
}
