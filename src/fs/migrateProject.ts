import { Project, Asset, AnyNode, Action, Sequence } from "../typings";
import { createAsset } from "../data/createNode";
import internalActionDefs from "../editor/inspector/functions/internalActionDefs";

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

function unescapeObjectValues(obj: any): any {
  if (typeof obj === "string") return unescapeString(obj);
  if (Array.isArray(obj)) return obj.map(unescapeObjectValues);
  if (typeof obj === "object" && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) result[key] = unescapeObjectValues(obj[key]);
    }
    return result;
  }
  return obj;
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

export function normalizeProjectMetadata(project: Project): Project {
  const raw = project as any;
  if (raw.app !== undefined && raw.appVersion === undefined && raw.schemaVersion !== undefined) {
    return project;
  }
  const version = raw.appVersion ?? raw.app?.version ?? "";
  const { appVersion: _removed, ...rest } = raw;
  const unescaped = unescapeObjectValues(rest);
  return {
    ...unescaped,
    schemaVersion: 2,
    app: { creator: "Choicelab", version },
  } as Project;
}

export function needsMigration(project: Project): boolean {
  return !Array.isArray((project as any).assets);
}

export function migrateProject(project: Project): Project {
  const assets: Asset[] = [];

  // Migrate action props
  project.sequences.forEach((sequence: Sequence) => {
    sequence.nodes.forEach((node: AnyNode) => {
      if (!node.actions) return;
      node.actions.forEach((action: Action) => {
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

  // Migrate background image in player settings
  Object.values(project.settings.player).forEach((playerSettings: any) => {
    const file = playerSettings?.appearance?.background?.file;
    if (typeof file === "string" && file !== "") {
      playerSettings.appearance.background.file = findOrCreateAsset(
        file,
        "image",
        assets
      );
    }
  });

  return { ...project, assets };
}
