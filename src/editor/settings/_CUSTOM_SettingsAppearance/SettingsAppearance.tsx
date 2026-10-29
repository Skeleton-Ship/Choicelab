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
import { AppearanceLayout } from "./AppearanceLayout";
import { AppearanceCustomCSS } from "./AppearanceCustomCSS";
import { AppearanceSettings } from "../../../typings";

type AppearanceValue<K extends keyof AppearanceSettings> =
  AppearanceSettings[K] extends object
    ? Partial<AppearanceSettings[K]>
    : AppearanceSettings[K];
export type AppearanceUpdate = <K extends keyof AppearanceSettings>(
  key: K,
  newValues: AppearanceValue<K>
) => void;

export interface AppearancePaneProps {
  initial: AppearanceSettings;
  update: AppearanceUpdate;
}

export function SettingsAppearance() {
  const store = getStore();
  const [pane, setPane] = useState("text");
  const initial = store.project.settings.appearance;
  useEffect(() => {
    loadPlayerFonts();
  }, []);
  const handleChange: AppearanceUpdate = (key, newValues) => {
    const newStore = getStore();
    const settings = newStore.project.settings.appearance;
    const current = settings[key];
    // Style groups are merged so a pane can update one field at a time
    settings[key] = (
      typeof current === "object" ? { ...current, ...(newValues as object) } : newValues
    ) as AppearanceSettings[typeof key];
    // Emit update
    emitTo(
      getProjectWindowLabel(store.projectPath),
      "settings-store-updated",
      stringify(newStore)
    );
  };
  return (
    <>
      <AppearanceList pane={pane} setPane={setPane} />
      <div id="appearance-properties" data-pane={pane}>
        {pane === "text" ? (
          <AppearanceText initial={initial} update={handleChange} />
        ) : pane === "inputs" ? (
          <AppearanceInputs initial={initial} update={handleChange} />
        ) : pane === "layout" ? (
          <AppearanceLayout initial={initial} update={handleChange} />
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
