import { Store, Project } from "../typings";
import setViewSettings from "../utils/setViewSettings";

function getStore() {
  const store: Store = window.__CHOICELAB_DATA__;
  return structuredClone(store);
}

function setStore(newStore: Store) {
  window.__CHOICELAB_DATA__ = structuredClone(newStore);
}

export default function createDataStore(
  projectData: Project,
  projectPath: string
) {
  const store: Store = {
    windowType: "project",
    project: projectData,
    projectPath: projectPath,
    history: {
      location: -1,
      versions: [],
    },
    currentSequenceId: "",
    targetMode: {
      active: false,
      origin: "",
      nodeId: "",
      stemId: "",
    },
    shiftDown: false,
    selectedNodes: [],
    selectedStem: false,
    clipboardListener: false,
    inTextElement: false,
    focus: false,
    saved: true,
    viewSettings: {
      cellWidth: 0,
      cellHeight: 0,
      cellMarginLeft: 0,
      cellMarginTop: 0,
      stemWidth: 0,
      stemHeight: 0,
      stemMarginLeft: 0,
      paneInView: "node-editor",
    },
  };
  store.viewSettings = setViewSettings(250, store);
  window.__CHOICELAB_DATA__ = store;
}

export { getStore, setStore, createDataStore };
