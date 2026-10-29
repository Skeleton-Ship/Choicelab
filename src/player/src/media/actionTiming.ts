import { Cell, Action } from "../../../schema/project";

interface ActionTiming {
  parentId: string;
  start: number;
  end: number;
}
export function getActionTiming(
  action: Action,
  cell: Cell
): ActionTiming | false {
  let actionIsTimed: ActionTiming | false = false;
  cell.actions.forEach((thisAction) => {
    if (action.id === thisAction.id || !thisAction.timedActions) return;
    if (thisAction.timedActions[action.id]) {
      actionIsTimed = {
        parentId: thisAction.id,
        ...thisAction.timedActions[action.id],
      };
    }
  });
  return actionIsTimed;
}
