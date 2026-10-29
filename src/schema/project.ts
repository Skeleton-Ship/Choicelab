/*
 * Types for the project file (.clx) format, shared by the editor and the player.
 * The player bundles separately, so this file must stay types-only: no imports, no runtime code.
 *
 * Current schema version: 3
 */

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
export type RuleOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqualTo"
  | "lessThanOrEqualTo";
export interface Rule {
  id: string;
  type: string;
  variableId: string;
  operator: RuleOperator | ""; // "" until the author picks a variable
  value: VariableValue;
}
export interface NodePosition {
  x: number;
  y: number;
  xSize: number;
  ySize: number;
  top: number;
  left: number;
  width?: number;
  height?: number;
  abandoned?: boolean;
}
export interface AnyNode {
  id: string;
  type: string;
  label?: string;
  actions?: Array<Action>;
  link?: Link;
  stems?: Array<Stem>;
  settings?: CellSettings;
  position?: NodePosition;
}
export interface StartNode {
  id: string;
  type: string;
  link: Link;
}
export interface CellSettings {
  transitionTime: number;
  navigationPoint: boolean;
}
export interface Cell {
  id: string;
  type: string;
  label: string;
  actions: Array<Action>;
  settings: CellSettings;
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
export type VariableType = "string" | "number" | "boolean";
export type VariableValue = string | number | boolean;
export interface Variable {
  name: string;
  id: string;
  description: string;
  varType: VariableType;
  startingValue: VariableValue;
}
export interface Asset {
  id: string;
  fileName: string;
  type: "image" | "audio" | "video" | "captions";
}

/*
 * Project settings
 */
export interface AppearanceTextStyle {
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  fontSize: string;
  color: string;
  transitionStyle: string;
  transitionDuration: string;
  width: string;
}
export interface AppearanceInputStyle extends Omit<AppearanceTextStyle, "color"> {
  textColor: string;
  backgroundColor: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
}
export type AspectRatio = "16/9" | "1/1" | "9/16";
export interface AppearanceSettings {
  headings: AppearanceTextStyle;
  subheadings: AppearanceTextStyle;
  bodyText: AppearanceTextStyle;
  inputs: AppearanceInputStyle;
  background: {
    color: string;
    file: string; // asset ID in the editor, file name in the player
    size?: string;
  };
  aspectRatio: AspectRatio;
  customCSS: string;
}
export interface ProjectSettings {
  rememberHistory: boolean;
  appearance: AppearanceSettings;
}

/*
 * Actions
 *
 * Props with a default in internalActionDefs are required; migrations fill them in for older projects.
 * Props without a default stay optional until the author sets them.
 */
export interface ActionPosition {
  kind: "absolute" | "grid";
  x: number;
  y: number;
}
export type ActionPropValue = string | number | boolean | ActionPosition;
type MediaBuild = "fade" | "none";
type MediaFit = "cover" | "contain";
export interface ActionPropsMap {
  text: {
    contents: string;
    role: "body" | "heading" | "subheading";
    position: ActionPosition;
    maxWidth: number;
  };
  image: {
    source: string;
    alt: string;
  };
  audio: {
    source?: string;
    captions?: string;
    endCell: boolean;
  };
  video: {
    source?: string;
    captions?: string;
    endCell: boolean;
    muted: boolean;
    buildIn: MediaBuild;
    buildOut: MediaBuild;
    fit: MediaFit;
  };
  button: {
    label: string;
    varToSet?: string;
    value?: VariableValue;
    position: ActionPosition;
    maxWidth: number;
  };
  // Not yet available in the editor
  inputField: {
    label: string;
    type: "text" | "textarea" | "number";
    varToSet?: string;
    position: ActionPosition;
    maxWidth: number;
  };
  backgroundAudio: {
    source?: string;
    loop: boolean;
    persist: boolean;
    name: string;
  };
  backgroundVideo: {
    source?: string;
    loop: boolean;
    muted: boolean;
    persist: boolean;
    name: string;
    buildIn: MediaBuild;
    buildOut: MediaBuild;
    fit: MediaFit;
  };
  endBackgroundAudio: {
    name: string;
  };
  endBackgroundVideo: {
    name: string;
  };
  silence: {
    duration: number;
  };
}
export type ActionName = keyof ActionPropsMap;
export interface ActionOf<N extends ActionName> {
  name: N;
  id: string;
  enabled: boolean;
  timedActions?: {
    [actionId: string]: {
      start: number;
      end: number;
    };
  };
  props: ActionPropsMap[N];
}
export type Action = { [N in ActionName]: ActionOf<N> }[ActionName];

export interface Project {
  schemaVersion: number;
  name: string;
  id: string;
  app: {
    creator: string;
    version: string;
  };
  settings: ProjectSettings;
  actions: {
    name: string;
    path: string;
  };
  variables: {
    items: Array<Variable>;
  };
  assets: Array<Asset>;
  sequences: Array<Sequence>;
}
