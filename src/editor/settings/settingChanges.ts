/*
 * Project setting changes
 *
 * The project settings window doesn't change the project itself: it asks the
 * project window to, which records each change as a setProjectSetting history
 * entry (see src/data/history.ts), then sends the updated store back.
 */

import { v4 as uuidv4 } from "uuid";
import { emitTo } from "@tauri-apps/api/event";
import structuredClone from "@ungap/structured-clone";
import { getStore, setStore } from "../../data/dataStore";
import {
  getProjectSetting,
  setProjectSetting,
  settingValuesEqual,
} from "../../data/projectSettings";
import { createSnapshotEntry, pushHistory } from "../../data/history";
import { getProjectWindowLabel } from "../../utils/getProjectWindowLabel";
import {
  Asset,
  HistoryEntry,
  ProjectSettingKey,
  ProjectSettingValue,
  SetProjectSettingHistoryEntry,
} from "../../typings";

export const SETTING_CHANGE_EVENT = "settings-change-requested";

export interface SettingChangeOptions {
  /** Merge into the previous change to this setting (see pushHistory) */
  merge?: boolean;
  /** Assets the new value uses, which the project doesn't have yet */
  assets?: Array<Asset>;
}

export interface SettingChangeRequest extends SettingChangeOptions {
  projectId: string;
  key: ProjectSettingKey;
  value: ProjectSettingValue;
}

/**
 * From the settings window: change a setting, showing it right away, and ask
 * the project window to apply it.
 */
export function requestSettingChange<K extends ProjectSettingKey>(
  key: K,
  value: ProjectSettingValue<K>,
  options: SettingChangeOptions = {}
) {
  const store = getStore();
  const settings = store.project.settings;
  if (settingValuesEqual(getProjectSetting(settings, key), value)) return;
  setProjectSetting(settings, key, value);
  setStore(store);
  const request: SettingChangeRequest = {
    projectId: store.project.id,
    key,
    value,
    ...options,
  };
  emitTo(getProjectWindowLabel(store.projectPath), SETTING_CHANGE_EVENT, request);
}

/**
 * In the project window: apply a setting change and record it in history.
 * Returns whether anything changed.
 */
export function applySettingChange(request: SettingChangeRequest): boolean {
  const store = getStore();
  if (request.projectId !== store.project.id) return false;
  const settings = store.project.settings;
  const before = structuredClone(getProjectSetting(settings, request.key));
  if (settingValuesEqual(before, request.value)) return false;
  // New assets are recorded as a snapshot, since assets belong to snapshots.
  // Grouping it with the setting makes them one undo step.
  const newAssets = (request.assets ?? []).filter(
    (asset) => !store.project.assets.some((existing) => existing.id === asset.id)
  );
  let assetsEntry: HistoryEntry | undefined;
  if (newAssets.length > 0) {
    store.project.assets.push(...newAssets);
    setStore(store);
    assetsEntry = createSnapshotEntry("settings");
  }
  setProjectSetting(settings, request.key, structuredClone(request.value));
  setStore(store);
  const settingEntry: SetProjectSettingHistoryEntry = {
    id: uuidv4(),
    kind: "setProjectSetting",
    source: "settings",
    key: request.key,
    before,
    after: structuredClone(request.value),
  };
  if (assetsEntry) {
    pushHistory({
      id: uuidv4(),
      kind: "group",
      source: "settings",
      entries: [assetsEntry, settingEntry],
    });
  } else {
    pushHistory(settingEntry, { merge: request.merge });
  }
  return true;
}
