import { Project, Asset, AnyNode, Action, Sequence } from "../typings";
import internalActionDefs from "../editor/inspector/functions/internalActionDefs";
import structuredClone from "@ungap/structured-clone";
import { getActionProp, setActionProp } from "../data/actionProps";

const ASSET_CONTROLS = new Set(["image", "audio", "video", "captions"]);

/**
 * Returns a deep-cloned copy of the project with all asset IDs in action props
 * and player settings resolved back to filenames. The player reads filenames
 * directly from the .clx, so the preview copy must not contain asset registry IDs.
 */
export function resolveAssetsForPlayer(project: Project): Project {
  const resolved: Project = structuredClone(project);
  const assetMap = new Map<string, string>(
    resolved.assets.map((a: Asset) => [a.id, a.fileName])
  );

  // Resolve action props
  resolved.sequences.forEach((sequence: Sequence) => {
    sequence.nodes.forEach((node: AnyNode) => {
      if (node.type !== "cell") return;
      node.actions.forEach((action: Action) => {
        const actionDef = internalActionDefs.actions.find(
          (def) => def.name === action.name
        );
        if (!actionDef) return;
        actionDef.props.forEach((propDef) => {
          if (!ASSET_CONTROLS.has(propDef.control)) return;
          const value = getActionProp(action, propDef.name);
          if (typeof value === "string" && assetMap.has(value)) {
            setActionProp(action, propDef.name, assetMap.get(value)!);
          }
        });
      });
    });
  });

  // Resolve background image in project settings
  const background = resolved.settings.appearance.background;
  if (assetMap.has(background.file)) {
    background.file = assetMap.get(background.file)!;
  }

  return resolved;
}
