import { setStore } from "../../../../data/dataStore";
import { Action, ActionDef, ActionDefProp, Store } from "../../../../typings";
import NumberField from "../NumberField";
import { getPlayerConfig } from "../../../../player/getPlayerConfig";

export default function TextField(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  fieldType: string;
  initialValue: string;
  extended: boolean;
  className: string;
  store: Store;
  update: Function;
}) {
  function handleChange(value: any) {
    if (!action) return;
    const propsObj =
      props.extended === false
        ? action.props
        : action.extendedProps[getPlayerConfig().id];
    propsObj[propDef.name] = value;
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
        const value = (e.target as HTMLInputElement).value;
        handleChange(value);
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
          const value = (e.target as HTMLInputElement).value;
          handleChange(value);
        }}
      >
        {props.initialValue}
      </textarea>
    );
  }
  if (props.fieldType === "number") {
    fieldEl = (
      <NumberField
        name={propElName}
        value={props.initialValue}
        decimalPlaces={2}
        onChange={(value: number) => {
          handleChange(value);
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
