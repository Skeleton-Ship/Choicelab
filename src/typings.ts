export interface Link {
  to: string;
}
export interface Stem {
  id: string;
  type: string;
  value: string;
  link: Link;
}
export interface Media {
  [key: string]: any;
}
export interface Evaluator {
  [key: string]: any;
}
export interface AnyNode {
  id: string;
  type: string;
  label?: string;
  evaluator?: Evaluator;
  actions?: Array<Action>;
  media?: Media;
  link?: Link;
  stems?: Array<Stem>;
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
  media: Media;
  link: Link;
}
export interface Branch {
  id: string;
  type: string;
  evaluator: Evaluator;
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
export interface Store {
  windowType: string;
  project: Project;
  projectPath: string;
  history: {
    location: number;
    versions: Array<string>;
  };
  currentSequenceId: string;
  targetMode: string;
  shiftDown: boolean;
  selectedNodes: Array<AnyNode>;
  selectedStem: Stem | false;
  clipboardListener: boolean;
  inTextElement: boolean;
  focus: boolean;
  saved: boolean;
  viewSettings: {
    cellWidth: number;
    cellHeight: number;
    cellMarginLeft: number;
    cellMarginTop: number;
    stemMarginLeft: number;
    paneInView: string;
  };
}
export interface Action {
  name: string;
  id: string;
  enabled: boolean;
  props: {
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
  description: string;
  props: Array<ActionDefProp>;
  extendable?: boolean;
  timedElement?: boolean;
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
declare global {
  interface Window {
    __CHOICELAB_DATA__: Store;
    __CHOICELAB_TARGET_MODE__: void | false;
    __CHOICELAB_ASSET_CACHE__: any;
  }
}
