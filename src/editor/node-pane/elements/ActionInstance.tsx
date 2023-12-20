import { setStore } from "../../../data/dataStore";
import { getActionDef, getCell } from "../../../data/getData";
import { deleteActionFromData } from "../../../data/deleteData";
import { Action, Store, Cell } from "../../../typings";
import internalActionDefs from "../functions/internalActionDefs";
import ActionPropEditor from "./ActionPropEditor";
import IconDelete from "../../../assets/icon-delete.svg";
import IconActionEnabled from "../../../assets/icon-action-enabled.svg";
import IconActionDisabled from "../../../assets/icon-action-disabled.svg";
import ActionIcon from "./ActionIcon";

function moveAction(arr: Array<any>, old_index: number, new_index: number) {
  if (new_index >= arr.length) {
    var k = new_index - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  const newActions: Array<any> = [];
  arr.forEach((item: any) => {
    if (typeof item === "undefined") {
      return;
    }
    newActions.push(item);
  });
  return newActions;
}

export default function ActionInstance(props: {
  instance: Action;
  cell: Cell;
  store: Store;
  update: Function;
}) {
  const action = props.instance;
  const actionDef = getActionDef(action.name, internalActionDefs);
  if (!actionDef) return <></>;
  // Enable/disable action
  function setEnabled() {
    if (action.enabled === true) {
      action.enabled = false;
    } else {
      action.enabled = true;
    }
    setStore(props.store);
    props.update();
  }
  // Delete action
  function handleDelete() {
    const newStore = deleteActionFromData(
      action.id,
      props.cell.id,
      props.store
    );
    setStore(newStore);
    props.update();
  }
  // Update position
  function updateArrayPosition(relativePosition: number) {
    const cell: Cell | undefined = getCell(props.cell.id, props.store);
    if (!cell) return;
    const actions = cell.actions;
    let existingPosition = -1;
    let iterator = 0;
    actions.forEach((thisAction: Action) => {
      if (props.instance.id === thisAction.id) {
        existingPosition = iterator;
      }
      iterator++;
    });
    if (actions.length > 1) {
      moveAction(
        actions,
        existingPosition,
        existingPosition + relativePosition
      );
      setStore(props.store);
      props.update();
    }
  }
  function canMoveAction(actionId: string) {
    const cell = props.cell;
    const actions = cell.actions;
    let up = true,
      down = true;
    for (var i = 0; i < actions.length; i++) {
      var action = actions[i];
      if (action.id === actionId) {
        if (i === 0) {
          up = false;
        }
        if (i === actions.length - 1) {
          down = false;
        }
      }
    }
    return {
      up: up,
      down: down,
    };
  }
  // Create an editor for each prop
  let propEls: Array<preact.JSX.Element> = [];
  const defProps = actionDef.props;
  defProps.forEach((defProp) => {
    const propKey = `action_${action.id}_prop_${defProp.name}`;
    const propEl = (
      <ActionPropEditor
        instance={props.instance}
        key={propKey}
        def={actionDef}
        defProp={defProp}
        store={props.store}
        update={props.update}
      />
    );
    propEls.push(propEl);
  });
  // Finally, make an editor el
  const iconEnabled =
    action.enabled === true ? IconActionEnabled : IconActionDisabled;
  const enabledClass = action.enabled === true ? `enabled` : `disabled`;
  const liClass = `action ${actionDef.name} ${enabledClass}`;
  const canMove = canMoveAction(action.id);
  const upDisabled = canMove.up === true ? false : true;
  const downDisabled = canMove.down === true ? false : true;
  return (
    <li class={liClass} key={action.id}>
      <div class="action-toolbar">
        <h5 class="action-name">
          <ActionIcon def={actionDef} />
          {actionDef.label}
        </h5>
        <div class="controls">
          <button
            disabled={upDisabled}
            onClick={() => {
              updateArrayPosition(-1);
            }}
          >
            ▲
          </button>
          <button
            disabled={downDisabled}
            onClick={() => {
              updateArrayPosition(1);
            }}
          >
            ▼
          </button>
          <button onClick={setEnabled}>
            <img src={iconEnabled} />
          </button>
          <button onClick={handleDelete}>
            <img src={IconDelete} />
          </button>
        </div>
      </div>
      <div class="props">{propEls}</div>
    </li>
  );
}
