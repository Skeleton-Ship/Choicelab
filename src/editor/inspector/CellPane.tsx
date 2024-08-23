import { useState, useEffect } from "preact/hooks";
import { getFocusedRegion } from "../../utils/focusedRegion";
import { getStore } from "../../data/dataStore";
import { getCell } from "../../data/getData";
import { Cell, Action, ActionDef } from "../../typings";
import addAction from "./functions/addAction";
import internalActionDefs from "./functions/internalActionDefs";
import ActionInstance from "./elements/ActionInstance";
import ActionIcon from "./elements/ActionIcon";
import { getPlayerConfig } from "../../player/getPlayerConfig";

function AvailableActions(props: { update: Function }) {
  const [selectedDef, selectDef] = useState("");
  useEffect(() => {
    document.addEventListener("pointerup", () => {
      if (getFocusedRegion() !== "available-actions") {
        selectDef("");
      }
    });
  }, []);
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
          <ActionIcon def={def} />
          <span class="action-label">{def.label}</span>
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

function ActionsEditor(props: { update: Function }) {
  const store = getStore();
  // 1 node is selected
  const selectedNodeId = store.selectedNodes[0].id;
  const node: Cell | undefined = getCell(selectedNodeId, store);
  if (!node) return <></>;
  let editorEls: Array<preact.JSX.Element> = [];
  node.actions.forEach((action: Action) => {
    const actionKey = `action_${action.id}`;
    editorEls.push(
      <ActionInstance
        key={actionKey}
        instance={action}
        cell={node}
        store={store}
        update={props.update}
      />
    );
  });
  return (
    <ul id="actions-editor">
      <div class="inner">{editorEls}</div>
    </ul>
  );
}

function NodeSettings(_props: { update: Function }) {
  const config = getPlayerConfig();
  console.log(config);
  return <div>Here be node settings</div>;
}

export default function CellPane(props: { update: Function }) {
  return (
    <>
      <AvailableActions update={props.update} />
      <ActionsEditor update={props.update} />
      <NodeSettings update={props.update} />
    </>
  );
}
