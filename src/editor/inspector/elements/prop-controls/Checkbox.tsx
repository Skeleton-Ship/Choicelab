import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store, UpdateFunction } from "../../../../typings";
import { getActionProp, setActionProp } from "../../../../data/actionProps";

export default function Checkbox(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  initialValue: boolean;
  className: string;
  store: Store;
  update: UpdateFunction;
}) {
  function handleChange(target: EventTarget | null) {
    if (target === null || !action) return;
    const value = (target as HTMLInputElement).checked;
    if (getActionProp(action, propDef.name) === value) return;
    setActionProp(action, propDef.name, value);
    setStore(props.store);
    props.update();
  }
  const action = props.action;
  const propDef = props.propDef;
  const propElName = `action_${action.id}_${propDef.name}`;
  const initialChecked = props.initialValue === true ? true : false;
  const className = `inspector-prop checkbox ${props.className}`;
  return (
    <div class={className}>
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
