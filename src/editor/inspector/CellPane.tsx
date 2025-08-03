import { useState, useEffect } from "preact/hooks";
import { getFocusedRegion } from "../../utils/focusedRegion";
import { getStore, getViewStore } from "../../data/dataStore";
import { getCell } from "../../data/getData";
import { Cell, Action, ActionDef } from "../../typings";
import addAction from "./functions/addAction";
import internalActionDefs from "./functions/internalActionDefs";
import ActionInstance from "./elements/ActionInstance";
import ActionIcon from "./elements/ActionIcon";
import { getPlayerConfig } from "../../player/getPlayerConfig";
import { NodeSetting } from "./elements/NodeSetting";
import { cellPlaysQuickly } from "./functions/cellPlaysQuickly";

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
  const store = getStore(),
    viewStore = getViewStore();
  // 1 node is selected
  const selectedNodeId = viewStore.selectedNodes[0].id;
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
    <ul
      id="actions-editor"
      class={editorEls.length === 0 ? "empty-contents" : ""}
    >
      <div class="inner">
        {editorEls.length === 0 ? (
          <p class="placeholder">No Actions Added</p>
        ) : (
          editorEls
        )}
        {cellPlaysQuickly(node) ? (
          <aside class="cell-plays-quickly">
            <p>
              <strong>This cell may play quickly.</strong> If that's not
              intentional, you can add media or an input control to make the
              cell play for longer.
            </p>
          </aside>
        ) : (
          <></>
        )}
      </div>
    </ul>
  );
}

function NodeSettings(props: { update: Function }) {
  const store = getStore(),
    viewStore = getViewStore();
  const selectedNodeId = viewStore.selectedNodes[0].id;
  const node: Cell | undefined = getCell(selectedNodeId, store);
  if (!node) return <></>;
  const activePlayerId = store.project.settings.activePlayer;
  // Create UI elements to edit
  const cellSettingsDefs = getPlayerConfig().nodeSettings.cell;
  const settingEls: Array<preact.JSX.Element> = [];
  const defKeys = Object.keys(cellSettingsDefs);
  defKeys.forEach((key) => {
    // @ts-ignore
    const settingDef = cellSettingsDefs[key];
    settingEls.push(
      <NodeSetting
        node={node}
        key={`node_${node.id}_setting_${key}`}
        settingName={key}
        store={store}
        playerId={activePlayerId}
        def={settingDef}
        update={props.update}
      />
    );
  });
  return (
    <ul id="node-settings">
      <div class="inner">{settingEls}</div>
    </ul>
  );
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
