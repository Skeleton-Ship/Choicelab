import { Store, ViewStore, Project } from "../typings";
import setViewSettings from "../utils/setViewSettings";
import structuredClone from "@ungap/structured-clone";

function getStore() {
  const store: Store = window.__CHOICELAB_DATA__;
  return structuredClone(store);
}

function setStore(newStore: Store) {
  window.__CHOICELAB_DATA__ = structuredClone(newStore);
}

function getViewStore() {
  const store: ViewStore = window.__CHOICELAB_VIEW__;
  return structuredClone(store);
}

function setViewStore(newStore: ViewStore) {
  window.__CHOICELAB_VIEW__ = structuredClone(newStore);
}

function updateView() {
  window.__CHOICELAB_FUNCTIONS__.updateView();
}

function createViewStore(projectPath: string) {
  const store: ViewStore = {
    windowType: "project",
    projectPath: projectPath,
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
      previewVisible: false,
    },
  };
  store.viewSettings = setViewSettings(250, store);
  window.__CHOICELAB_VIEW__ = store;
}

export default function createDataStore(
  projectData: Project,
  projectPath: string,
  projectFileName: string
) {
  const store: Store = {
    project: projectData,
    projectPath: projectPath,
    projectFileName: projectFileName,
    history: {
      location: -1,
      versions: [],
    },
  };
  window.__CHOICELAB_DATA__ = store;
}

export {
  getStore,
  setStore,
  getViewStore,
  setViewStore,
  updateView,
  createDataStore,
  createViewStore,
};
