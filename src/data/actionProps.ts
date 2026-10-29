import structuredClone from "@ungap/structured-clone";
import { Action, ActionDef, ActionPropValue } from "../typings";

/*
 * Inspector controls are driven by ActionDefs, so they only know a prop's name at runtime.
 * These helpers are the one place that bridges a def's prop name to an action's typed props.
 */
type PropsByName = Record<string, ActionPropValue | undefined>;

export function getActionProp(
  action: Action,
  name: string
): ActionPropValue | undefined {
  return (action.props as PropsByName)[name];
}

export function setActionProp(
  action: Action,
  name: string,
  value: ActionPropValue
): void {
  (action.props as PropsByName)[name] = value;
}

// Fills in any props the action is missing with the def's defaults.
// Defaults are cloned so that editing one action's props never mutates the def.
export function applyActionDefaults(action: Action, actionDef: ActionDef) {
  actionDef.props.forEach((propDef) => {
    if (typeof propDef.default === "undefined") return;
    if (typeof getActionProp(action, propDef.name) !== "undefined") return;
    setActionProp(action, propDef.name, structuredClone(propDef.default));
  });
}
