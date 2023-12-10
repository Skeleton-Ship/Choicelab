export interface Link {
  to: string;
}
export interface Stem {
  id: string;
  type: string;
  value: string;
  link: Link;
}
export interface Action {
  [key: string]: any;
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
  type: string;
}
export interface Project {
  name: string;
  id: string;
  variables: {
    [key: string]: Variable;
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
  selectedStem: Stem | undefined;
  clipboardListener: boolean;
  inTextElement: boolean;
  focus: boolean;
  selection: {
    listenersActive: boolean;
    selecting: boolean;
    keepExistingSelection: boolean;
    nodesInSelection: Array<AnyNode>;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    offsetTop: number;
    offsetLeft: number;
  };
  dragging: {
    listenersActive: boolean;
    nodeToChange: string;
  };
  saved: boolean;
}
declare global {
  interface Window {
    __CHOICELAB_DATA__: Store;
  }
}
