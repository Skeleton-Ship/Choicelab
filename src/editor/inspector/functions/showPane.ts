import { getStore, setStore } from "../../../data/dataStore";

export default function showPane(paneName: string, update: Function) {
  const store = getStore();
  store.viewSettings.paneInView = paneName;
  setStore(store);
  update(false);
}
