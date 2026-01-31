import { PredefinedMenuItem } from "@tauri-apps/api/menu";
import { canUndo, canRedo } from "../data/history";
import { undoItem, redoItem } from "./undoRedoItems";
import { getViewStore } from "../data/dataStore";
import inTextElement from "../utils/inTextElement";

export function setMenu(windowState: string = "project") {
  const fns = window.__CHOICELAB_FUNCTIONS__;
  const update = fns.updateProject;
  const viewStore = getViewStore();
  const isProjectState = windowState === "project" ? true : false;
  const states = {
    file: {
      save: {
        enabled: isProjectState === true ? true : false,
      },
    },
    edit: {
      undo: {
        enabled: isProjectState === false ? false : canUndo(),
        action: async () => {
          if (inTextElement() === true) {
            // @ts-ignore
            return await PredefinedMenuItem.new({
              item: "Undo",
            });
          } else {
            undoItem(update);
          }
        },
        redo: {
          enabled: isProjectState === false ? false : canRedo(),
          action: async () => {
            if (inTextElement() === true) {
              // @ts-ignore
              return await PredefinedMenuItem.new({
                item: "Redo",
              });
            } else {
              redoItem(update);
            }
          },
        },
      },
    },
    view: {
      showNodeEditor: {
        enabled: isProjectState === true ? true : false,
        checked:
          viewStore && viewStore.viewSettings.paneInView === "node-editor"
            ? true
            : false,
      },
      showVariables: {
        enabled: isProjectState === true ? true : false,
        checked:
          viewStore && viewStore.viewSettings.paneInView === "variables"
            ? true
            : false,
      },
      togglePreview: {
        enabled: isProjectState === true ? true : false,
      },
    },
    project: {
      newCell: {
        enabled: isProjectState === true ? true : false,
      },
      newBranch: {
        enabled: isProjectState === true ? true : false,
      },
      setLink: {
        enabled:
          isProjectState === true && viewStore.selectedNodes.length > 0
            ? true
            : false,
      },
      disconnectLink: {
        enabled:
          isProjectState === true && viewStore.selectedNodes.length > 0
            ? true
            : false,
      },
      deleteNodes: {
        enabled:
          isProjectState === true &&
          viewStore &&
          viewStore.selectedNodes.length > 0 &&
          viewStore.selectedNodes[0].type !== "start"
            ? true
            : false,
      },
      deleteStem: {
        enabled:
          viewStore &&
          viewStore.selectedStem !== false &&
          viewStore.selectedStem.type !== "noMatch"
            ? true
            : false,
      },
      openInBrowser: {
        enabled: isProjectState === true ? true : false,
      },
      projectSettings: {
        enabled: isProjectState === true ? true : false,
      },
    },
  };
}
