import { getVersion } from "@tauri-apps/api/app";
import { compare } from "compare-versions";
import { getAppPreferences, setAppPreferences } from "./appPreferences";
import { emit } from "@tauri-apps/api/event";

export async function showReleaseNotes() {
  const preferences = await getAppPreferences();
  const thisVersion = await getVersion();
  if (compare(thisVersion, preferences.versionNotesSeen, ">")) {
    emit("whatsNew-window"); // done on Rust side because window is also called by Swift
    setAppPreferences({
      versionNotesSeen: thisVersion,
    });
  }
}
