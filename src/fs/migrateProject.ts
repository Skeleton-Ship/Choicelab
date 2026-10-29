import {
  Project,
  Asset,
  AnyNode,
  Action,
  ActionPropValue,
  AppearanceSettings,
  Cell,
  CellSettings,
  Link,
  NodePosition,
  Stem,
  ProjectSettings,
  Sequence,
} from "../typings";
import { createAsset } from "../data/createNode";
import { applyActionDefaults } from "../data/actionProps";
import { createCellSettings, createProjectSettings } from "../data/settingsDefs";
import internalActionDefs from "../editor/inspector/functions/internalActionDefs";

/*
 * Schema history
 * 1: Unversioned. Asset file names stored directly in props, `appVersion` at the root.
 * 2: Asset registry, `app` metadata.
 * 3: Player-specific props (`extendedProps`) and settings (`settings.player`) flattened
 *    into the action's props and the cell/project settings.
 */
export const CURRENT_SCHEMA_VERSION = 3;

// The only player that has ever existed; all player-specific data is keyed under it
const LEGACY_PLAYER_ID = "choicelab-player-html5";

/*
 * Shapes from schema versions 1 and 2
 */
type LegacyProps = Record<string, ActionPropValue | undefined>;
interface LegacyAction {
  name: string;
  id: string;
  enabled: boolean;
  timedActions?: Action["timedActions"];
  props: LegacyProps;
  extendedProps?: Record<string, LegacyProps>;
}
interface LegacyNode {
  id: string;
  type: AnyNode["type"];
  label?: string;
  link?: Link;
  stems?: Array<Stem>;
  position?: NodePosition;
  actions?: Array<LegacyAction>;
  settings?: { player?: Record<string, Partial<CellSettings>> };
}
type LegacyAppearance = {
  [K in keyof AppearanceSettings]?: AppearanceSettings[K] extends object
    ? Partial<AppearanceSettings[K]>
    : AppearanceSettings[K];
} & { background?: { kind?: string } };
interface LegacyPlayerSettings {
  rememberHistory?: boolean;
  appearance?: LegacyAppearance;
}
interface LegacyProject
  extends Omit<Project, "schemaVersion" | "app" | "settings" | "assets" | "sequences"> {
  schemaVersion?: number;
  appVersion?: string;
  app?: Project["app"];
  settings: {
    activePlayer?: string;
    player?: Record<string, LegacyPlayerSettings>;
  };
  assets?: Array<Asset>;
  sequences: Array<Omit<Sequence, "nodes"> & { nodes: Array<LegacyNode> }>;
}

/*
 * 1 -> 2
 */
function unescapeString(str: string): string {
  // Reverses the double-escaping introduced by the old stringify's manual escapeString pass.
  // JSON.parse has already run, so spurious backslashes added before quotes and whitespace
  // control characters are now literal chars in memory — strip them.
  return str
    .replace(/((?:\\\\)*)\\"/g, (_, p1) => `${p1}"`)
    .replace(/((?:\\\\)*)\\\n/g, (_, p1) => `${p1}\n`)
    .replace(/((?:\\\\)*)\\\r/g, (_, p1) => `${p1}\r`)
    .replace(/((?:\\\\)*)\\\t/g, (_, p1) => `${p1}\t`);
}

function unescapeObjectValues<T>(value: T): T {
  if (typeof value === "string") return unescapeString(value) as T;
  if (Array.isArray(value)) return value.map(unescapeObjectValues) as T;
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = unescapeObjectValues(child);
    }
    return result as T;
  }
  return value;
}

const ASSET_CONTROLS = new Set(["image", "audio", "video", "captions"]);

function findOrCreateAsset(
  fileName: string,
  type: Asset["type"],
  assets: Asset[]
): string {
  const existing = assets.find((a) => a.fileName === fileName);
  if (existing) return existing.id;
  const asset = createAsset(fileName, type);
  assets.push(asset);
  return asset.id;
}

function migrateAssets(project: LegacyProject): Asset[] {
  const assets: Asset[] = [];
  // Action props
  project.sequences.forEach((sequence) => {
    sequence.nodes.forEach((node) => {
      if (!node.actions) return;
      node.actions.forEach((action) => {
        const actionDef = internalActionDefs.actions.find(
          (def) => def.name === action.name
        );
        if (!actionDef) return;
        actionDef.props.forEach((propDef) => {
          if (!ASSET_CONTROLS.has(propDef.control)) return;
          const value = action.props[propDef.name];
          if (typeof value === "string" && value !== "") {
            action.props[propDef.name] = findOrCreateAsset(
              value,
              propDef.control as Asset["type"],
              assets
            );
          }
        });
      });
    });
  });
  // Background image in player settings
  Object.values(project.settings.player ?? {}).forEach((playerSettings) => {
    const background = playerSettings.appearance?.background;
    if (typeof background?.file === "string" && background.file !== "") {
      background.file = findOrCreateAsset(background.file, "image", assets);
    }
  });
  return assets;
}

function migrateToV2(project: LegacyProject): LegacyProject {
  const assets = Array.isArray(project.assets)
    ? project.assets
    : migrateAssets(project);
  const version = project.appVersion ?? project.app?.version ?? "";
  const { appVersion: _removed, ...rest } = project;
  return {
    ...unescapeObjectValues({ ...rest, assets }),
    schemaVersion: 2,
    app: { creator: "Choicelab", version },
  };
}

/*
 * 2 -> 3
 */
function flattenProjectSettings(legacy: LegacyPlayerSettings = {}): ProjectSettings {
  const settings = createProjectSettings();
  if (typeof legacy.rememberHistory === "boolean") {
    settings.rememberHistory = legacy.rememberHistory;
  }
  const appearance = settings.appearance;
  const legacyAppearance = legacy.appearance ?? {};
  appearance.headings = { ...appearance.headings, ...legacyAppearance.headings };
  appearance.subheadings = { ...appearance.subheadings, ...legacyAppearance.subheadings };
  appearance.bodyText = { ...appearance.bodyText, ...legacyAppearance.bodyText };
  appearance.inputs = { ...appearance.inputs, ...legacyAppearance.inputs };
  const legacyBackground = { ...legacyAppearance.background };
  // `kind` was retired when the background color began showing beneath the image
  delete legacyBackground.kind;
  appearance.background = { ...appearance.background, ...legacyBackground };
  appearance.aspectRatio = legacyAppearance.aspectRatio ?? appearance.aspectRatio;
  appearance.customCSS = legacyAppearance.customCSS ?? appearance.customCSS;
  return settings;
}

function flattenAction(legacy: LegacyAction): Action {
  const { extendedProps, ...rest } = legacy;
  const action = {
    ...rest,
    props: { ...extendedProps?.[LEGACY_PLAYER_ID], ...legacy.props },
  } as Action;
  const actionDef = internalActionDefs.actions.find(
    (def) => def.name === action.name
  );
  if (actionDef) applyActionDefaults(action, actionDef);
  return action;
}

function flattenNode(legacy: LegacyNode): AnyNode {
  // Only cells carry actions and player settings
  if (legacy.type !== "cell") return legacy as AnyNode;
  const { actions, settings, ...rest } = legacy;
  // Cells have always been created with both, but fill them in if a file is missing either
  return {
    ...rest,
    actions: (actions ?? []).map(flattenAction),
    settings: {
      ...createCellSettings(),
      ...settings?.player?.[LEGACY_PLAYER_ID],
    },
  } as Cell;
}

function migrateToV3(project: LegacyProject): Project {
  return {
    ...project,
    schemaVersion: 3,
    app: project.app ?? { creator: "Choicelab", version: "" },
    assets: project.assets ?? [],
    settings: flattenProjectSettings(project.settings.player?.[LEGACY_PLAYER_ID]),
    sequences: project.sequences.map((sequence) => ({
      ...sequence,
      nodes: sequence.nodes.map(flattenNode),
    })),
  };
}

/*
 * Entry points
 */
function getSchemaVersion(project: Project | LegacyProject): number {
  return project.schemaVersion ?? 1;
}

export function needsMigration(project: Project | LegacyProject): boolean {
  return getSchemaVersion(project) < CURRENT_SCHEMA_VERSION;
}

// Runs each migration step in order, from the project's schema version to the current one
export function migrateProject(project: Project | LegacyProject): Project {
  let legacy = project as LegacyProject;
  if (getSchemaVersion(legacy) < 2) legacy = migrateToV2(legacy);
  if (getSchemaVersion(legacy) < 3) return migrateToV3(legacy);
  return project as Project;
}
