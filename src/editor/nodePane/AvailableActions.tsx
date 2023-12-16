import { useState } from "preact/hooks";
import { ActionDef } from "../../typings";
import internalActionDefs from "./internalActionDefs";
import addAction from "./addAction";

export default function AvailableActions(props: { update: Function }) {
  const [selectedDef, selectDef] = useState("");
  function handleAddAction(actionDef: ActionDef) {
    addAction(actionDef, props.update);
  }
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
  return (
    <ul id="available-actions">
      <div class="inner">
        <h4>Add an Action:</h4>
        {actions}
      </div>
    </ul>
  );
}
