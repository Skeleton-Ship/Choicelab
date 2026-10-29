import { Menu } from "@tauri-apps/api/menu";
import type { ActionPropValue, AnyNode, Project, Stem } from "./schema/project";

export type * from "./schema/project";

export interface ProjectHistory {
  location: number;
  versions: Array<string>;
}
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
  history: {
    location: number;
    versions: Array<string>;
  };
}
export interface ActionDef {
  name: string;
  label: string;
  editor?: {
    iconName: string;
    iconColor: string;
    iconBackgroundColor: string;
  };
  flowchart?: any;
  category?: "timeline" | "interact" | "event";
  description: string;
  props: Array<ActionDefProp>;
  timedElement?: boolean;
  inputElement?: boolean;
  mediaElement?: boolean;
}
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
  url: any;
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
