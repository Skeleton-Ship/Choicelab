import {
  AppearanceSettings,
  ProjectSettingKey,
  ProjectSettingValue,
  ProjectSettings,
} from "../typings";
import { BooleanProjectSettingName } from "./settingsDefs";

const APPEARANCE_PREFIX = "appearance.";

type ParsedKey =
  | { group: "appearance"; name: keyof AppearanceSettings }
  | { group: "general"; name: BooleanProjectSettingName };

function parseKey(key: ProjectSettingKey): ParsedKey {
  if (key.startsWith(APPEARANCE_PREFIX)) {
    return {
      group: "appearance",
      name: key.slice(APPEARANCE_PREFIX.length) as keyof AppearanceSettings,
    };
  }
  return { group: "general", name: key as BooleanProjectSettingName };
}

export function getProjectSetting<K extends ProjectSettingKey>(
  settings: ProjectSettings,
  key: K
): ProjectSettingValue<K> {
  const parsed = parseKey(key);
  const value =
    parsed.group === "appearance"
      ? settings.appearance[parsed.name]
      : settings[parsed.name];
  return value as ProjectSettingValue<K>;
}

export function setProjectSetting<K extends ProjectSettingKey>(
  settings: ProjectSettings,
  key: K,
  value: ProjectSettingValue<K>
): void {
  const parsed = parseKey(key);
  if (parsed.group === "appearance") {
    (settings.appearance as Record<keyof AppearanceSettings, unknown>)[
      parsed.name
    ] = value;
  } else {
    (settings as Record<BooleanProjectSettingName, unknown>)[parsed.name] =
      value;
  }
}

/** Whether two setting values are the same */
export function settingValuesEqual(
  a: ProjectSettingValue,
  b: ProjectSettingValue
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * The key and value for setting one appearance property. (TypeScript can't
 * match a generic appearance property to its setting key on its own.)
 */
export function appearanceSetting<K extends keyof AppearanceSettings>(
  name: K,
  value: AppearanceSettings[K]
): { key: ProjectSettingKey; value: ProjectSettingValue } {
  return { key: `${APPEARANCE_PREFIX}${name}` as ProjectSettingKey, value };
}
