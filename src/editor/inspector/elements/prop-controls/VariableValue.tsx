import { useEffect } from "preact/hooks";
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
  function handleChange(
    target: EventTarget | null,
    varType: string,
    directValue?: any
  ) {
    if (!action) return;
    const rawValue =
      target !== null ? (target as HTMLInputElement).value : undefined;
    let value;
    // Cast numbers and bools to be actual values
    switch (varType) {
      case "string":
        value = rawValue;
        break;
      case "number":
        if (typeof directValue !== "undefined") {
          value = directValue;
        } else {
          if (rawValue) {
            value = parseFloat(rawValue);
            if (isNaN(value)) value = 0;
          } else {
            value = 0;
          }
        }
        break;
      case "boolean":
        value = rawValue === "true" ? true : false;
        break;
    }
    action.props[propDef.name] = value;
    setStore(props.store);
    props.update();
  }
  // Set defaults for variable value
  useEffect(() => {
    if (!variableId) return;
    if (
      typeof variable !== "undefined" &&
      typeof action.props[propDef.name] === "undefined"
    ) {
      switch (variable.varType) {
        case "string":
          action.props[propDef.name] = "";
          break;
        case "boolean":
          action.props[propDef.name] = true;
          break;
        case "number":
          action.props[propDef.name] = 0;
          break;
      }
      setStore(props.store);
      props.update();
    }
  }, []);
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
          decimalPlaces={2}
          onChange={(value: number) => {
            handleChange(null, variable.varType, value);
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
