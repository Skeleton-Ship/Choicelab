import { getViewStore, setViewStore } from "../../../data/dataStore";
import { UpdateFunction } from "../../../typings";

export default function showPane(paneName: string, update: UpdateFunction) {
  const viewStore = getViewStore();
  viewStore.viewSettings.paneInView = paneName;
  setViewStore(viewStore);
  update(false, false);
}
