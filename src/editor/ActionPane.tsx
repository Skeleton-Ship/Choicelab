import internalActionDefs from "./actionPane/internalActionDefs";
import { ActionDef } from "../typings";
import { getStore } from "../data/dataStore";

export default function ActionPane(props: { update: Function }) {
  let contents = <></>;
  const store = getStore();
  if (store.selectedNodes.length <= 0) {
    contents = <></>;
  } else if (store.selectedNodes.length > 1) {
    contents = <p class="placeholder">Multiple nodes selected</p>;
  } else {
    const selectedNode = store.selectedNodes[0];
    console.log(selectedNode);
    // Get names of action defs
    const actions = internalActionDefs.actions.map((def: ActionDef) => {
      return (
        <li>
          <button title={def.description}>{def.label}</button>
        </li>
      );
    });
    contents = (
      <>
        <ul id="available-actions">
          <h4>Add an Action:</h4>
          {actions}
        </ul>
        <ul id="slotted-actions"></ul>
      </>
    );
  }
  return (
    <div id="action-pane" class="pane right">
      <div class="resizer"></div>
      {contents}
    </div>
  );
}
