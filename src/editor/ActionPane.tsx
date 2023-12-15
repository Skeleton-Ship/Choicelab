import { useState } from "preact/hooks";
import internalActionDefs from "./actionPane/internalActionDefs";
import addAction from "./actionPane/addAction";
import { ActionDef } from "../typings";
import { getStore } from "../data/dataStore";

export default function ActionPane(props: { update: Function }) {
  let contents = <></>;
  const store = getStore();
  const [selectedDef, selectDef] = useState("");
  function handleAddAction(actionDef: ActionDef) {
    addAction(actionDef, props.update);
  }
  if (store.selectedNodes.length <= 0) {
    // If no node is selected
    contents = <p class="placeholder">No node selected</p>;
  } else if (store.selectedNodes.length > 1) {
    // If multiple nodes are selected
    contents = <p class="placeholder">Multiple nodes selected</p>;
  } else {
    // 1 node is selected
    const selectedNode = store.selectedNodes[0];
    console.log(selectedNode);
    // Get names of action defs
    const actions = internalActionDefs.actions.map((def: ActionDef) => {
      const selectedClass = selectedDef === def.name ? "selected" : "";
      return (
        <li>
          <button
            class={selectedClass}
            title={def.description}
            onClick={() => {
              selectDef(def.name);
            }}
            onDblClick={() => {
              handleAddAction(def);
            }}
          >
            {def.label}
          </button>
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
