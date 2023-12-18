import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionProp, Store } from "../../../../typings";

export default function Checkbox(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionProp;
  initialValue: boolean;
  store: Store;
  update: Function;
}) {
  function handleChange(target: EventTarget | null) {
    if (target === null || !action) return;
    const value = (target as HTMLInputElement).checked;
    action.props[propDef.name] = value;
    setStore(props.store);
    props.update();
  }
  const action = props.action;
  const propDef = props.propDef;
  const propElName = `action_${action.id}_${propDef.name}`;
  const initialChecked = props.initialValue === true ? true : false;
  return (
    <div class="action-prop checkbox">
      <input
        type="checkbox"
        name={propElName}
        id={propElName}
        checked={initialChecked}
        onChange={(e) => {
          handleChange(e.target);
        }}
      />
      &nbsp;
      <label class="label" for={propElName}>
        {propDef.label}
      </label>
    </div>
  );
}
