import { useState, useEffect } from "preact/hooks";
import { getStore } from "../../../data/dataStore";
import { loadPlayerFonts } from "../../../utils/loadPlayerFonts";
import { AppearanceList } from "./List";
import { AppearanceText } from "./AppearanceText";
import { AppearanceBackground } from "./AppearanceBackground";
import { AppearanceInputs } from "./AppearanceInputs";
import { AppearanceLayout } from "./AppearanceLayout";
import { AppearanceCustomCSS } from "./AppearanceCustomCSS";
import { AppearanceSettings } from "../../../typings";
import { appearanceSetting } from "../../../data/projectSettings";
import {
  requestSettingChange,
  SettingChangeOptions,
} from "../settingChanges";

type AppearanceValue<K extends keyof AppearanceSettings> =
  AppearanceSettings[K] extends object
    ? Partial<AppearanceSettings[K]>
    : AppearanceSettings[K];
export type AppearanceUpdate = <K extends keyof AppearanceSettings>(
  key: K,
  newValues: AppearanceValue<K>,
  options?: SettingChangeOptions
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
  const handleChange: AppearanceUpdate = (key, newValues, options) => {
    const current = getStore().project.settings.appearance[key];
    // Style groups are merged so a pane can update one field at a time
    const value = (
      typeof current === "object" ? { ...current, ...(newValues as object) } : newValues
    ) as AppearanceSettings[typeof key];
    const setting = appearanceSetting(key, value);
    requestSettingChange(setting.key, setting.value, options);
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
