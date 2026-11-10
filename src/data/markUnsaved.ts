import { getViewStore, setViewStore } from "./dataStore";
import { setDocumentEdited } from "../utils/windowTitle";

export default function markUnsaved() {
  const newStore = getViewStore();
  newStore.saved = false;
  setViewStore(newStore);
  setDocumentEdited(true);
}
