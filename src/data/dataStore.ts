import { Store, Project } from "../typings";

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
    targetMode: "",
    shiftDown: false,
    selectedNodes: [],
    selectedStem: false,
    clipboardListener: false,
    inTextElement: false,
    focus: false,
    saved: true,
    viewSettings: {
      cellWidth: 225,
      cellHeight: 100,
      cellMarginLeft: 275,
      cellMarginTop: 275,
      stemWidth: 135,
      stemHeight: 54,
      stemMarginLeft: 240,
      paneInView: "node-editor",
    },
  };
  window.__CHOICELAB_DATA__ = store;
  window.__CHOICELAB_TARGET_MODE__ = false;
}

export { getStore, setStore, createDataStore };
