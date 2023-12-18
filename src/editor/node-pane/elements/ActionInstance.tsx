import { setStore } from "../../../data/dataStore";
import { getActionDef } from "../../../data/getData";
import { Action, Store } from "../../../typings";
import internalActionDefs from "../functions/internalActionDefs";
import ActionPropEditor from "./ActionPropEditor";
import IconDelete from "../../../assets/icon-delete.svg";
import IconActionEnabled from "../../../assets/icon-action-enabled.svg";
import IconActionDisabled from "../../../assets/icon-action-disabled.svg";

export default function ActionInstance(props: {
  instance: Action;
  store: Store;
  update: Function;
}) {
  const action = props.instance;
  const actionDef = getActionDef(action.name, internalActionDefs);
  if (!actionDef) return <></>;
  // Bind enabled
  function setEnabled() {
    if (action.enabled === true) {
      action.enabled = false;
    } else {
      action.enabled = true;
    }
    setStore(props.store);
    props.update();
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
  return (
    <li class={liClass} key={action.id}>
      <div class="action-toolbar">
        <h5 class="action-name">{actionDef.label}</h5>
        <div class="controls">
          <button>▲</button>
          <button>▼</button>
          <button onClick={setEnabled}>
            <img src={iconEnabled} />
          </button>
          <button>
            <img src={IconDelete} />
          </button>
        </div>
      </div>
      <div class="props">{propEls}</div>
    </li>
  );
}
