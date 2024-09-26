import { getStore } from "../../../data/dataStore";
import { Action, Cell } from "../../../typings";

export function timeableActionInUse(action: Action) {
  let inUse = false;
  const store = getStore();
  store.project.sequences.forEach((sequence) => {
    sequence.nodes.forEach((node) => {
      if (node.type !== "cell") return;
      const thisNode = node as Cell;
      thisNode.actions.forEach((thisAction) => {
        if (thisAction.childActions) {
          if (thisAction.childActions[action.id]) {
            inUse = true;
          }
        }
      });
    });
  });
  return inUse;
}
