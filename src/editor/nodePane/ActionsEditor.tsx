import { getStore } from "../../data/dataStore";
import { getCell } from "../../data/getData";
import { Cell, Action } from "../../typings";

export default function ActionsEditor(props: { update: Function }) {
  const store = getStore();
  console.log("refresh");
  console.log(props);
  // 1 node is selected
  const selectedNodeId = store.selectedNodes[0].id;
  const node: Cell | undefined = getCell(selectedNodeId, store);
  if (!node) return;
  let actionsStr = "";
  node.actions.forEach((action: Action) => {
    actionsStr += action.name + " ";
  });
  return <ul id="actions-editor">{actionsStr}</ul>;
}
