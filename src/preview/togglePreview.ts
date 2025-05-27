import { getStore, setStore } from "../data/dataStore";

export function togglePreview(update: Function) {
  const store = getStore();
  const currentSetting = store.viewSettings.previewVisible;
  const newSetting = currentSetting === true ? false : true;
  store.viewSettings.previewVisible = newSetting;
  if (newSetting === true) {
    document.documentElement.style.setProperty("--preview-height", "300px");
  } else {
    document.documentElement.style.setProperty("--preview-height", "0px");
  }
  setStore(store);
  update(false);
}
