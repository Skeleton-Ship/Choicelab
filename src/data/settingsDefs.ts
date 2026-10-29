import structuredClone from "@ungap/structured-clone";
import { CellSettings, ProjectSettings } from "../typings";

export interface SettingDef<T> {
  label: string;
  labelSuffix?: string;
  description?: string;
  type: "boolean" | "number" | "__CUSTOM__ProjectAppearance";
  default: T;
}
type SettingDefs<T> = { [K in keyof T]: SettingDef<T[K]> };
export type BooleanProjectSettingName = {
  [K in keyof ProjectSettings]: ProjectSettings[K] extends boolean ? K : never;
}[keyof ProjectSettings];

export interface ProjectSettingsPane {
  label: string;
  id: "general" | "appearance";
  description: string;
  settings: Array<keyof ProjectSettings>;
}

export const cellSettingsDefs: SettingDefs<CellSettings> = {
  transitionTime: {
    label: "Wait",
    labelSuffix: "seconds before starting",
    type: "number",
    default: 0.3,
  },
  navigationPoint: {
    label: "Clear text and buttons before cell starts",
    type: "boolean",
    default: true,
  },
};

export const projectSettingsPanes: Array<ProjectSettingsPane> = [
  {
    label: "General",
    id: "general",
    description: "",
    settings: ["rememberHistory"],
  },
  {
    label: "Appearance",
    id: "appearance",
    description: "",
    settings: ["appearance"],
  },
];

export const projectSettingsDefs: SettingDefs<ProjectSettings> = {
  rememberHistory: {
    label: "Remember history when browser reloads",
    description: "Playback will resume from the last cell seen.",
    type: "boolean",
    default: true,
  },
  appearance: {
    label: "",
    type: "__CUSTOM__ProjectAppearance",
    default: {
      headings: {
        fontFamily: "Inter",
        fontStyle: "normal",
        fontWeight: "700",
        fontSize: "var(--font-size-lg)",
        color: "white",
        transitionStyle: "fade",
        transitionDuration: "0.3s",
        width: "auto",
      },
      subheadings: {
        fontFamily: "Inter",
        fontStyle: "normal",
        fontWeight: "600",
        fontSize: "var(--font-size-md)",
        color: "white",
        transitionStyle: "fade",
        transitionDuration: "0.3s",
        width: "auto",
      },
      bodyText: {
        fontFamily: "Inter",
        fontStyle: "normal",
        fontWeight: "400",
        fontSize: "var(--font-size-md)",
        color: "white",
        transitionStyle: "fade",
        transitionDuration: "0.3s",
        width: "auto",
      },
      inputs: {
        fontFamily: "Inter",
        fontStyle: "normal",
        fontWeight: "600",
        fontSize: "var(--font-size-md)",
        textColor: "white",
        backgroundColor: "#0080DC",
        transitionStyle: "fade",
        transitionDuration: "0.3s",
        width: "auto",
      },
      background: {
        color: "#232328",
        file: "",
      },
      aspectRatio: "16/9",
      customCSS: "",
    },
  },
};

// Defaults are cloned so that editing one project's settings never mutates the defs
function getDefaults<T extends object>(defs: SettingDefs<T>): T {
  const settings = {} as T;
  (Object.keys(defs) as Array<keyof T>).forEach((key) => {
    settings[key] = structuredClone(defs[key].default);
  });
  return settings;
}

export function createCellSettings(): CellSettings {
  return getDefaults(cellSettingsDefs);
}

export function createProjectSettings(): ProjectSettings {
  return getDefaults(projectSettingsDefs);
}
