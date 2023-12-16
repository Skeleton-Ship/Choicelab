import { getStore } from "../../data/dataStore";

export default function ActionsEditor(props: { update: Function }) {
  const store = getStore();
  console.log(props);
  // 1 node is selected
  const selectedNode = store.selectedNodes[0];
  console.log(selectedNode);
  let actionsStr = "";
  if (selectedNode.actions) {
    selectedNode.actions.forEach((action) => {
      actionsStr += action.name;
    });
  }
  return <ul id="actions-editor">{actionsStr}</ul>;
}
