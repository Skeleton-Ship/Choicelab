/*
 * Types for the project file (.clx) format, shared by the editor and the player.
 * It lives with the player so that the player, which is MIT-licensed (see
 * src/player/LICENSE), is self-contained; the editor imports it from here.
 * Keep it types-only (no imports, no runtime code), so importing it never
 * brings player code into the editor.
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
// Set by the flowchart when the node is laid out
interface PositionedNode {
  position?: NodePosition;
}
export interface StartNode extends PositionedNode {
  id: string;
  type: "start";
  link: Link;
}
export interface CellSettings {
  transitionTime: number;
  navigationPoint: boolean;
}
export interface Cell extends PositionedNode {
  id: string;
  type: "cell";
  label: string;
  actions: Array<Action>;
  settings: CellSettings;
  link: Link;
}
export interface Branch extends PositionedNode {
  id: string;
  type: "branch";
  stems: Array<Stem>;
}
export type AnyNode = StartNode | Cell | Branch;
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
/*
 * Rich text, stored as a subset of Portable Text (https://www.portabletext.org).
 * Each block is a paragraph; a "\n" in a span's text is a line break within it.
 * Inline objects reference other project data by ID, never by name.
 */
export interface RichTextSpan {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
}
export interface RichTextVariable {
  _type: "variable";
  _key: string;
  variableId: string;
}
export type RichTextInline = RichTextSpan | RichTextVariable;
export interface RichTextBlock {
  _type: "block";
  _key: string;
  style: "normal";
  markDefs: never[];
  children: RichTextInline[];
}
export type RichText = RichTextBlock[];
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
export type ActionPropValue = string | number | boolean | ActionPosition | RichText;
type MediaBuild = "fade" | "none";
type MediaFit = "cover" | "contain";
export interface ActionPropsMap {
  text: {
    contents: RichText;
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
    label: RichText;
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
