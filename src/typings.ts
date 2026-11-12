import { Menu } from "@tauri-apps/api/menu";
import type { FunctionComponent } from "preact";
import type {
  ActionName,
  ActionPropsMap,
  ActionPropValue,
  AnyNode,
  AppearanceSettings,
  Project,
  ProjectSettings,
  Stem,
} from "./player/src/schema/project";
import type { BooleanProjectSettingName } from "./data/settingsDefs";

export type * from "./player/src/schema/project";

// Re-renders from the app root after a store change (see MainEditor's handleUpdate)
export type UpdateFunction = (
  updateHistory?: boolean,
  updatePreview?: boolean
) => void;
/**
 * Project undo history: a stack of entries, each one change that can be
 * undone and redone. See src/data/history.ts.
 */
export interface ProjectHistory {
  /** Snapshot of the project as it was opened, before any entries */
  baseline: string;
  entries: Array<HistoryEntry>;
  /** How many entries are applied; undo steps back from here */
  location: number;
}
/** The window a history entry came from */
export type HistorySource = "editor" | "settings";
/**
 * A change recorded as whole-project snapshots: undo restores `before`, redo
 * restores `after`. This is the original history model, which other entry
 * kinds will gradually replace.
 */
export interface SnapshotHistoryEntry {
  id: string;
  kind: "snapshot";
  source: HistorySource;
  /** Snapshot (cache version ID) of the project before this change */
  before: string;
  /** Snapshot (cache version ID) of the project after this change */
  after: string;
}
/**
 * A change to one project setting. Settings belong to commands: snapshot
 * entries leave them as they are (see src/data/history.ts).
 */
export interface SetProjectSettingHistoryEntry {
  id: string;
  kind: "setProjectSetting";
  source: HistorySource;
  key: ProjectSettingKey;
  before: ProjectSettingValue;
  after: ProjectSettingValue;
}
/** Several entries undone and redone as one step */
export interface GroupHistoryEntry {
  id: string;
  kind: "group";
  source: HistorySource;
  entries: Array<HistoryEntry>;
}
export type HistoryEntry =
  | SnapshotHistoryEntry
  | SetProjectSettingHistoryEntry
  | GroupHistoryEntry;
/**
 * A single project setting: a top-level setting, or one property of the
 * appearance settings. Read and write them with getProjectSetting() /
 * setProjectSetting() in src/data/projectSettings.ts.
 */
export type ProjectSettingKey =
  | BooleanProjectSettingName
  | `appearance.${keyof AppearanceSettings}`;
type ProjectSettingValues = {
  [K in BooleanProjectSettingName]: ProjectSettings[K];
} & {
  [K in keyof AppearanceSettings as `appearance.${K}`]: AppearanceSettings[K];
};
export type ProjectSettingValue<K extends ProjectSettingKey = ProjectSettingKey> =
  ProjectSettingValues[K];
export interface ViewStore {
  windowType: string;
  projectName: string;
  projectPath: string;
  currentSequenceId: string;
  targetMode: {
    active: boolean;
    origin: string;
    nodeId: string;
    stemId?: string;
  };
  selectedNodes: Array<AnyNode>;
  selectedStem: Stem | false;
  autoGenerateLabel: string | null;
  clipboardListener: boolean;
  inTextElement: boolean;
  focus: boolean;
  saved: boolean;
  previewPort: number;
  viewSettings: {
    cellWidth: number;
    cellHeight: number;
    cellMarginLeft: number;
    cellMarginTop: number;
    stemWidth: number;
    stemHeight: number;
    stemMarginLeft: number;
    paneInView: string;
    previewVisible: boolean;
  };
}
export type WindowType =
  | "project"
  | "projectSettings"
  | "launcher"
  | "whatsNew"
  | "acknowledgments"
  | "license";
export interface Store {
  project: Project;
  projectPath: string;
  projectFileName: string;
  history: ProjectHistory;
}
export interface ActionDefOf<N extends ActionName> {
  name: N;
  label: string;
  editor?: {
    iconName: string;
    iconColor: string;
    iconBackgroundColor: string;
  };
  flowchart?: FunctionComponent<ActionPropsMap[N]>;
  category?: "timeline" | "interact" | "event";
  description: string;
  props: Array<ActionDefProp>;
  timedElement?: boolean;
  inputElement?: boolean;
  mediaElement?: boolean;
}
export type ActionDef = { [N in ActionName]: ActionDefOf<N> }[ActionName];
export interface ActionDefProp {
  name: string;
  label: string;
  labelSuffix?: string;
  control: string;
  default?: ActionPropValue;
  required?: boolean;
  className?: string;
  options?: Array<ActionDefPropDropdownOption>;
}
export interface ActionDefPropDropdownOption {
  value: string;
  label: string;
}
export interface ActionDefs {
  name: string;
  label: string;
  actions: Array<ActionDef>;
}
export interface LoadError {
  error: string;
}

export interface PlayerFontStyle {
  name: string;
  style: string;
  weight: string;
  url: { default: string }; // a dynamically imported font file
}

export interface PlayerFont {
  name: string;
  sizeFactor?: number;
  styles: Array<PlayerFontStyle>;
}

export interface PlayerFonts {
  families: { [key: string]: PlayerFont };
}

declare global {
  interface Window {
    __CHOICELAB_DATA_RAW__: string;
    __CHOICELAB_FUNCTIONS__: {
      updateProject: (saveProject?: boolean, updatePreview?: boolean) => void;
      updateView: () => void;
      menus: {
        project: Menu | null;
        projectSettings: Menu | null;
        launcher: Menu | null;
        whatsNew: Menu | null;
        acknowledgments: Menu | null;
      };
    };
    __CHOICELAB_DATA__: Store;
    __CHOICELAB_VIEW__: ViewStore;
  }
}
