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
    selection: {
      listenersActive: false,
      selecting: false,
      keepExistingSelection: false,
      nodesInSelection: [],
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      offsetTop: 0,
      offsetLeft: 0,
    },
    dragging: {
      listenersActive: false,
      nodeToChange: "",
    },
    saved: true,
  };
  window.__CHOICELAB_DATA__ = store;
}

export { getStore, setStore, createDataStore };
