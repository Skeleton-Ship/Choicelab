import { ChangeEvent } from "preact/compat";
import { getPlayerConfig } from "../../player/getPlayerConfig";
import { getStore } from "../../data/dataStore";
import { emitTo } from "@tauri-apps/api/event";
import { stringify } from "../../utils/stringify";
import { getProjectWindowLabel } from "../../utils/getProjectWindowLabel";

export function SettingBoolean(props: {
  name: string;
  label: string;
  description?: string;
}) {
  const inputName = `projectSettings_${props.name}`;
  const store = getStore();
  const initial =
    store.project.settings.player[getPlayerConfig().id][props.name];
  function handleChange(e: ChangeEvent) {
    const el = e.target as HTMLInputElement;
    const newStore = getStore();
    const settings = newStore.project.settings.player[getPlayerConfig().id];
    if (settings[props.name] === el.checked) return;
    settings[props.name] = el.checked;
    // Emit update
    emitTo(
      getProjectWindowLabel(store.projectPath),
      "settings-store-updated",
      stringify(newStore)
    );
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
