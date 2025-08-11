import { useState, useEffect } from "preact/hooks";
import { getStore } from "../../../data/dataStore";
import { emitTo } from "@tauri-apps/api/event";
import { loadPlayerFonts } from "../../../utils/loadPlayerFonts";
import { getProjectWindowLabel } from "../../../utils/getProjectWindowLabel";
import { stringify } from "../../../utils/stringify";
import { AppearanceList } from "./List";
import { AppearanceText } from "./AppearanceText";
import { AppearanceBackground } from "./AppearanceBackground";
import { AppearanceInputs } from "./AppearanceInputs";
import { AppearanceCustomCSS } from "./AppearanceCustomCSS";

export function SettingsAppearance() {
  const store = getStore();
  const [pane, setPane] = useState("text");
  const initial =
    store.project.settings.player["choicelab-player-html5"]["appearance"];
  useEffect(() => {
    loadPlayerFonts();
  }, []);
  function handleChange(key: string, newValues: { [key: string]: any }) {
    const newStore = getStore();
    const settings =
      newStore.project.settings.player["choicelab-player-html5"]["appearance"];
    settings[key] = { ...settings[key], ...newValues };
    // Emit update
    emitTo(
      getProjectWindowLabel(store.projectPath),
      "settings-store-updated",
      stringify(newStore)
    );
  }
  return (
    <>
      <AppearanceList pane={pane} setPane={setPane} />
      <div id="appearance-properties">
        {pane === "text" ? (
          <AppearanceText initial={initial} update={handleChange} />
        ) : pane === "inputs" ? (
          <AppearanceInputs initial={initial} update={handleChange} />
        ) : pane === "background" ? (
          <AppearanceBackground initial={initial} update={handleChange} />
        ) : pane === "custom-css" ? (
          <AppearanceCustomCSS initial={initial} update={handleChange} />
        ) : (
          <></>
        )}
      </div>
    </>
  );
}
