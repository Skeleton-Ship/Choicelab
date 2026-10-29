import { Cell, CellSettings, UpdateFunction } from "../../../typings";
import { setStore } from "../../../data/dataStore";
import { Store } from "../../../typings";
import { SettingDef } from "../../../data/settingsDefs";
import NumberField from "./NumberField";

type SettingValue = CellSettings[keyof CellSettings];

/*
 * A setting for a node that appears at the bottom of the inspector.
 */
export function NodeSetting(props: {
  node: Cell;
  settingName: keyof CellSettings;
  store: Store;
  def: SettingDef<SettingValue>;
  update: UpdateFunction;
}) {
  // Controls are chosen by the def's type, so the value always matches the setting it's written to
  const settings = props.node.settings as Record<keyof CellSettings, SettingValue>;
  function handleChange(newValue: SettingValue) {
    if (settings[props.settingName] === newValue) return;
    settings[props.settingName] = newValue;
    setStore(props.store);
    props.update();
  }
  const existingValue = settings[props.settingName];
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
            checked={existingValue === true}
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
            step={0.1}
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
