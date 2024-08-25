import { Cell, Branch } from "../../../typings";
import { setStore } from "../../../data/dataStore";
import { Store } from "../../../typings";

function sanitizeTimingValue(value: string) {
  let newValue: string | number = value;
  newValue = newValue.replace(/[^0-9.]/g, "");
  if (newValue.endsWith(".")) {
    newValue += "0";
  }
  if (newValue === "") {
    newValue = "0";
  }
  // Check for the last occurrence of a period
  const lastDotIndex = newValue.lastIndexOf(".");

  // If there is a period, check the number of digits after it
  if (lastDotIndex !== -1) {
    const integerPart = newValue.substring(0, lastDotIndex + 1);
    let decimalPart = newValue.substring(lastDotIndex + 1);

    // If more than 2 decimal places, truncate to 2
    if (decimalPart.length > 2) {
      decimalPart = decimalPart.substring(0, 2);
    }

    newValue = integerPart + decimalPart;
  }
  newValue = parseFloat(newValue);
  if (isNaN(newValue)) {
    newValue = 0;
  }
  return newValue;
}

export function NodeSetting(props: {
  node: Cell | Branch;
  settingName: string;
  playerId: string;
  store: Store;
  def: { [key: string]: any };
  update: Function;
}) {
  function handleChange(newValue: any, type: string) {
    if (type === "number") {
      newValue = sanitizeTimingValue(newValue);
    }
    props.node.settings[props.playerId][props.settingName] = newValue;
    setStore(props.store);
    props.update();
  }
  const existingValue = props.node.settings[props.playerId][props.settingName];
  let control: preact.JSX.Element = <></>;
  const controlId = `node_${props.node.id}_control_${props.settingName}`;
  switch (props.def.type) {
    case "boolean":
      control = (
        <label class="checkbox" for={controlId}>
          <input
            type="checkbox"
            id={controlId}
            name={controlId}
            checked={existingValue}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              const value = target.checked;
              handleChange(value, "checkbox");
            }}
          />{" "}
          <span>{props.def.label}</span>
        </label>
      );
      break;
    case "number":
      control = (
        <label class="number" for={controlId}>
          <span>{props.def.label}</span>
          <input
            type="number"
            class="field short"
            id={controlId}
            name={controlId}
            value={existingValue}
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              const value = target.value;
              handleChange(value, "number");
            }}
          />
          {props.def.labelSuffix ? (
            <span class="suffix">{props.def.labelSuffix}</span>
          ) : (
            ""
          )}
        </label>
      );
  }
  return <li class="node-setting">{control}</li>;
}
