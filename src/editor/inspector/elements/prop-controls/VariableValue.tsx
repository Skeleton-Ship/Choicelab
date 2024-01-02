import { getStore, setStore } from "../../../../data/dataStore";
import {
  Action,
  ActionDef,
  ActionDefProp,
  Variable,
  Store,
} from "../../../../typings";
import { getVariable } from "../../../../data/getData";
import NumberField from "../NumberField";

export default function VariableValueControl(props: {
  action: Action;
  actionDef: ActionDef;
  propDef: ActionDefProp;
  varFieldName: string;
  initialValue: any;
  className: string;
  store: Store;
  update: Function;
}) {
  function handleChange(target: EventTarget | null, varType: string) {
    if (target === null || !action) return;
    const rawValue = (target as HTMLInputElement).value;
    let value;
    // Cast numbers and bools to be actual values
    switch (varType) {
      case "string":
        value = rawValue;
        break;
      case "number":
        value = parseFloat(rawValue);
        if (isNaN(value)) value = 0;
        break;
      case "boolean":
        value = rawValue === "true" ? true : false;
        break;
    }
    action.props[propDef.name] = value;
    setStore(props.store);
    props.update();
  }
  const action = props.action;
  const propDef = props.propDef;
  const propElName = `action_${action.id}_${propDef.name}`;
  const className = `inspector-prop text-field ${props.className}`;
  // Get the variable corresponding to this value field
  const variableId = action.props[props.varFieldName];
  if (!variableId || variableId === "") {
    return <></>;
  }
  const store = getStore();
  const variable: Variable | undefined = getVariable(variableId, store);
  if (!variable) {
    return <></>;
  }
  let fieldEl = <></>;
  switch (variable.varType) {
    case "string":
      fieldEl = (
        <input
          name={propElName}
          type="text"
          class="ui-text-field"
          value={props.initialValue}
          onChange={(e) => {
            handleChange(e.target, variable.varType);
          }}
        />
      );
      break;
    case "number":
      fieldEl = (
        <NumberField
          name={propElName}
          value={props.initialValue}
          onChange={(e: Event) => {
            handleChange(e.target, variable.varType);
          }}
        />
      );
      break;
    case "boolean":
      fieldEl = (
        <div class="ui-dropdown">
          <select
            name={propElName}
            value={props.initialValue}
            onChange={(e) => {
              handleChange(e.target, variable.varType);
            }}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      );
      break;
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
