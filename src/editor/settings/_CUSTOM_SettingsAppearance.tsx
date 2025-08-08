import { getStore } from "../../data/dataStore";
import { getPlayerConfig } from "../../player/getPlayerConfig";

export function SettingsAppearance() {
  const store = getStore();
  const settings =
    store.project.settings.player[getPlayerConfig().id]["appearance"];
  console.log(settings);
  return (
    <div>
      <div id="appearance-list">
        <button>Headings</button>
        <button>Subheadings</button>
      </div>
      <div id="appearance-properties">Here are some properties</div>
    </div>
  );
}
