import { getVersion } from "@tauri-apps/api/app";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { compare } from "compare-versions";
import { getAppPreferences, setAppPreferences } from "./appPreferences";

export async function showReleaseNotes() {
  const preferences = await getAppPreferences();
  const thisVersion = await getVersion();
  if (compare(thisVersion, preferences.versionNotesSeen, ">")) {
    const notesWindow = new WebviewWindow("whats-new");
    notesWindow.show();
    notesWindow.setFocus();
    setAppPreferences({
      versionNotesSeen: thisVersion,
    });
  }
}
