import { Action, ActionDef } from "../../../typings";
import internalActionDefs from "../functions/internalActionDefs";

export function getActionDef(action: Action): ActionDef | undefined {
  let actionDef;
  internalActionDefs.actions.forEach((thisDef) => {
    if (thisDef.name === action.name) {
      actionDef = thisDef;
    }
  });
  return actionDef;
}
