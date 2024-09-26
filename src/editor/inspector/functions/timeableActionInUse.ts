import { getStore } from "../../../data/dataStore";
import { Action, Cell } from "../../../typings";

export function timeableActionInUse(
  timeableAction: Action,
  currentAction: Action
) {
  let inUse = false;
  const store = getStore();
  store.project.sequences.forEach((sequence) => {
    sequence.nodes.forEach((node) => {
      if (node.type !== "cell") return;
      const thisNode = node as Cell;
      thisNode.actions.forEach((thisAction) => {
        if (thisAction.timedActions && thisAction.id !== currentAction.id) {
          if (thisAction.timedActions[timeableAction.id]) {
            inUse = true;
          }
        }
      });
    });
  });
  return inUse;
}
