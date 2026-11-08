import { Store } from "../typings";
import internalActionDefs from "../editor/inspector/functions/internalActionDefs";
import { getActionDef } from "./getData";
import { getActionProp } from "./actionProps";

export interface VariableUses {
  /** Action props (e.g. a button's "set variable") pointing at the variable */
  actions: number;
  /** Inline {} references in text */
  inline: number;
  /** Branch stems with at least one rule that checks the variable */
  stems: number;
}

export function countVariableUses(variableId: string, store: Store): VariableUses {
  const uses: VariableUses = { actions: 0, inline: 0, stems: 0 };
  store.project.sequences.forEach((sequence) => {
    sequence.nodes.forEach((node) => {
      if (node.type === "cell") {
        node.actions.forEach((action) => {
          const actionDef = getActionDef(action.name, internalActionDefs);
          if (!actionDef) return;
          actionDef.props.forEach((propDef) => {
            if (
              propDef.control === "variable" &&
              getActionProp(action, propDef.name) === variableId
            ) {
              uses.actions++;
            }
          });
          // TODO: count inline {} references once they exist
        });
      } else if (node.type === "branch") {
        node.stems.forEach((stem) => {
          if (stem.rules.some((rule) => rule.variableId === variableId)) {
            uses.stems++;
          }
        });
      }
    });
  });
  return uses;
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Describes a variable's uses as a readable list, e.g. "3 actions, 1 inline
 * reference, and 2 branch stems". Returns an empty string if it has none.
 */
export function describeVariableUses(uses: VariableUses): string {
  const parts: string[] = [];
  if (uses.actions) parts.push(plural(uses.actions, "action", "actions"));
  if (uses.inline)
    parts.push(plural(uses.inline, "inline reference", "inline references"));
  if (uses.stems) parts.push(plural(uses.stems, "branch stem", "branch stems"));
  if (parts.length <= 2) return parts.join(" and ");
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}
