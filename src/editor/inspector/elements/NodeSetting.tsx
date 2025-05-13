import { Cell } from "../../../typings";
import { setStore } from "../../../data/dataStore";
import { Store } from "../../../typings";
import NumberField from "./NumberField";

export function NodeSetting(props: {
  node: Cell;
  settingName: string;
  playerId: string;
  store: Store;
  def: { [key: string]: any };
  update: Function;
}) {
  function handleChange(newValue: any) {
    props.node.settings.player[props.playerId][props.settingName] = newValue;
    setStore(props.store);
    props.update();
  }
  const existingValue =
    props.node.settings.player[props.playerId][props.settingName];
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
              handleChange(value);
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
          <NumberField
            name={controlId}
            value={existingValue}
            min={0}
            showSpinner={false}
            decimalPlaces={2}
            onChange={(value: number) => {
              handleChange(value);
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
