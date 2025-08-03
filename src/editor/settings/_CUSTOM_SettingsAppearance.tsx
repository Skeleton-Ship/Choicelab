import { getStore } from "../../data/dataStore";
import { getPlayerConfig } from "../../player/getPlayerConfig";

export function SettingsAppearance() {
  const store = getStore();
  const settings =
    store.project.settings.player[getPlayerConfig().id]["appearance"];
  console.log(settings);
  return <div>Appearance settings</div>;
}
