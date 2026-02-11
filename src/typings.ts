import { Menu } from "@tauri-apps/api/menu";

export interface Link {
  to: string;
}
export interface Stem {
  id: string;
  type: string;
  match: string;
  rules: Array<Rule>;
  link: Link;
}
export interface Rule {
  id: string;
  type: string;
  variableId: string;
  operator: string;
  value: string | number | boolean;
}
export interface AnyNode {
  id: string;
  type: string;
  label?: string;
  actions?: Array<Action>;
  link?: Link;
  stems?: Array<Stem>;
  settings?: { [key: string]: any };
  position?: {
    x: number;
    y: number;
    xSize: number;
    ySize: number;
    top: number;
    left: number;
    width: number;
    height: number;
    abandoned?: boolean;
  };
}
export interface StartNode {
  id: string;
  type: string;
  link: Link;
}
export interface Cell {
  id: string;
  type: string;
  label: string;
  actions: Array<Action>;
  settings: { [key: string]: any };
  link: Link;
}
export interface Branch {
  id: string;
  type: string;
  stems: Array<Stem>;
}
export interface Sequence {
  id: string;
  label: string;
  nodes: Array<AnyNode>;
}
export interface Variable {
  name: string;
  id: string;
  description: string;
  varType: string;
  startingValue: string | number | boolean;
}
export interface Project {
  name: string;
  id: string;
  appVersion: string;
  settings: {
    activePlayer: string;
    player: any;
  };
  actions: {
    name: string;
    path: string;
  };
  variables: {
    items: Array<Variable>;
  };
  sequences: Array<Sequence>;
}
export interface ProjectHistory {
  location: number;
  versions: Array<string>;
}
export interface ViewStore {
  windowType: string;
  projectPath: string;
  currentSequenceId: string;
  targetMode: {
    active: boolean;
    origin: string;
    nodeId: string;
    stemId?: string;
  };
  shiftDown: boolean;
  selectedNodes: Array<AnyNode>;
  selectedStem: Stem | false;
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
  | "whatsNew";
export interface Store {
  project: Project;
  projectPath: string;
  projectFileName: string;
  history: {
    location: number;
    versions: Array<string>;
  };
}
export interface Action {
  name: string;
  id: string;
  enabled: boolean;
  timedActions?: {
    [key: string]: {
      start: number;
      end: number;
    };
  };
  props: {
    [key: string]: any;
  };
  extendedProps: {
    [key: string]: any;
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
  description: string;
  props: Array<ActionDefProp>;
  extendable?: boolean;
  timedElement?: boolean;
  inputElement?: boolean;
  mediaElement?: boolean;
}
export interface ActionDefProp {
  name: string;
  label: string;
  control: string;
  value?: any;
  default?: any;
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
      };
    };
    __CHOICELAB_DATA__: Store;
    __CHOICELAB_VIEW__: ViewStore;
  }
}
