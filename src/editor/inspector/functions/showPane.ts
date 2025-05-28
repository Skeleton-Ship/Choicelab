import { getViewStore, setViewStore } from "../../../data/dataStore";

export default function showPane(paneName: string, update: Function) {
  const viewStore = getViewStore();
  viewStore.viewSettings.paneInView = paneName;
  setViewStore(viewStore);
  update(false);
}
