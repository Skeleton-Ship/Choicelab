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
import { createPlayerSettings } from "../../../player/createPlayerSettings";
import { getPlayerSettings } from "../../../data/getData";

export function SettingsAppearance() {
  const store = getStore();
  const [pane, setPane] = useState("text");
  let initial = getPlayerSettings(store, "appearance");
  // If appearance settings don't exist, create them
  if (!initial) {
    const newSettings = createPlayerSettings("project", "appearance").settings
      .appearance;
    store.project.settings.player["choicelab-player-html5"]["appearance"] =
      newSettings;
    initial = newSettings;
    emitTo(
      getProjectWindowLabel(store.projectPath),
      "settings-store-updated",
      stringify(store)
    );
  }
  useEffect(() => {
    loadPlayerFonts();
  }, []);
  function handleChange(key: string, newValues: { [key: string]: any }) {
    const newStore = getStore();
    const settings =
      newStore.project.settings.player["choicelab-player-html5"]["appearance"];
    if (key === "customCSS") {
      settings[key] = newValues.css;
    } else {
      settings[key] = { ...settings[key], ...newValues };
    }
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
      <div id="appearance-properties" data-pane={pane}>
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
