import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";

export default function TextField(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  fieldType: string;
  initialValue: string;
  className: string;
  store: Store;
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
  const className = `inspector-prop text-field ${props.className}`;
  let fieldEl = (
    <input
      name={propElName}
      type="text"
      class="ui-text-field"
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
        class="ui-text-area"
        onChange={(e) => {
          handleChange(e.target);
        }}
      >
        {props.initialValue}
      </textarea>
    );
  }
  if (props.fieldType === "number") {
    fieldEl = (
      <input
        name={propElName}
        type="number"
        class="ui-text-field"
        value={props.initialValue}
        onChange={(e) => {
          handleChange(e.target);
        }}
      />
    );
  }
  return (
    <div class={className}>
      <label class="label break-line" for={propElName}>
        {propDef.label}
      </label>
      {fieldEl}
    </div>
  );
}
