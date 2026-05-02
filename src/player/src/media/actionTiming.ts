import { Cell, Action } from "../typings-project";

interface ActionTiming {
  parentId: string;
  start: number;
  end: number;
}
export function getActionTiming(
  action: Action,
  cell: Cell
): ActionTiming | false {
  let actionIsTimed = false;
  cell.actions.forEach((thisAction) => {
    // @ts-ignore
    if (action.id === thisAction.id || !thisAction.timedActions) return;
    // @ts-ignore
    if (thisAction.timedActions[action.id]) {
      actionIsTimed = {
        parentId: thisAction.id,
        // @ts-ignore
        ...thisAction.timedActions[action.id],
      };
    }
  });
  return actionIsTimed;
}
