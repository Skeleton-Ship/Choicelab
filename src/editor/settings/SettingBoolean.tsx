import { ChangeEvent } from "preact/compat";
import { getStore } from "../../data/dataStore";
import { BooleanProjectSettingName } from "../../data/settingsDefs";
import { requestSettingChange } from "./settingChanges";

export function SettingBoolean(props: {
  name: BooleanProjectSettingName;
  label: string;
  description?: string;
}) {
  const inputName = `projectSettings_${props.name}`;
  const store = getStore();
  const initial = store.project.settings[props.name];
  function handleChange(e: ChangeEvent) {
    const el = e.target as HTMLInputElement;
    requestSettingChange(props.name, el.checked);
  }
  return (
    <div class="setting boolean">
      <input
        type="checkbox"
        name={inputName}
        id={inputName}
        checked={initial}
        onChange={handleChange}
      />
      &nbsp;
      <label class="label" for={inputName}>
        {props.label}
        {props.description ? (
          <span class="description">{props.description}</span>
        ) : null}
      </label>
    </div>
  );
}
