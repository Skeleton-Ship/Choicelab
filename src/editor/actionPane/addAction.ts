import { ActionDef } from "../../typings";
import { getStore } from "../../data/dataStore";

export default function addAction(actionDef: ActionDef, update: Function) {
  const store = getStore();
  const selectedNode = store.selectedNodes[0];
  console.log("Going to add this action:");
  console.log(actionDef);
  console.log(selectedNode);
}
