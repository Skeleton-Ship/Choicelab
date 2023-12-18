import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";

export default function TextField(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  initialValue: string;
  store: Store;
  fieldType: string;
  update: Function;
}) {
  function handleChange(target: EventTarget | null) {
    if (target === null || !action) return;
    const value = (target as HTMLInputElement).value;
    action.props[propDef.name] = value;
    setStore(props.store);
    props.update();
  }
  const action = props.action;
  const propDef = props.propDef;
  const propElName = `action_${action.id}_${propDef.name}`;
  let fieldEl = (
    <input
      name={propElName}
      type="text"
      value={props.initialValue}
      onChange={(e) => {
        handleChange(e.target);
      }}
    />
  );
  if (props.fieldType === "textarea") {
    fieldEl = (
      <textarea
        name={propElName}
        id={propElName}
        onChange={(e) => {
          handleChange(e.target);
        }}
      >
        {props.initialValue}
      </textarea>
    );
  }
  return (
    <div class="action-prop text-field">
      <label class="label break-line" for={propElName}>
        {propDef.label}
      </label>
      {fieldEl}
    </div>
  );
}
