import { getStore, setStore } from "../data/dataStore";

export function togglePreview(update: Function) {
  const store = getStore();
  const currentSetting = store.viewSettings.previewVisible;
  store.viewSettings.previewVisible = currentSetting === true ? false : true;
  setStore(store);
  update(false);
}
