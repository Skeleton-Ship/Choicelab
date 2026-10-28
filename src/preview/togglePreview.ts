import { getViewStore, setViewStore } from "../data/dataStore";
import { updatePreview } from "./updatePreview";

export function togglePreview(update: Function) {
  const viewStore = getViewStore();
  const currentSetting = viewStore.viewSettings.previewVisible;
  const newSetting = currentSetting === true ? false : true;
  viewStore.viewSettings.previewVisible = newSetting;
  if (newSetting === true) {
    document.documentElement.style.setProperty("--preview-height", "300px");
  } else {
    document.documentElement.style.setProperty("--preview-height", "0px");
  }
  setViewStore(viewStore);
  update(false);
  // Update preview after toggling it, very hacky
  setTimeout(() => {
    updatePreview();
  }, 50);
}
