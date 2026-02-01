import { MenuItem, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
import { emit } from "@tauri-apps/api/event";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { canUndo, canRedo } from "../data/history";
import { undoItem, redoItem } from "./undoRedoItems";
import { getViewStore } from "../data/dataStore";
import inTextElement from "../utils/inTextElement";
import { WindowType } from "../typings";

type SubmenuId = "app" | "file" | "edit" | "view" | "project";

type SubmenuState = {
  [K in SubmenuId]?: {
    [key: string]: {
      enabled?: boolean;
      checked?: boolean;
      action?: Function;
      text?: string;
    };
  };
};

export async function setMenu(windowType: WindowType = "project") {
  if (!document.hasFocus()) {
    return;
  }
  const platform = getPlatform();
  const fns = window.__CHOICELAB_FUNCTIONS__;
  const update = fns.updateProject;
  const viewStore = getViewStore();
  const states: SubmenuState = {
    app: {},
    file: {
      new_project: {
        enabled: windowType !== "projectSettings" ? true : false,
      },
      open_project: {
        enabled: windowType !== "projectSettings" ? true : false,
      },
      save: {
        enabled: windowType === "project" ? true : false,
      },
    },
    edit: {
      undo: {
        enabled: windowType === "project" ? canUndo() : false,
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
      },
      redo: {
        enabled: windowType === "project" ? canRedo() : false,
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
    view: {
      show_node_editor: {
        enabled: windowType === "project" ? true : false,
        checked:
          viewStore && viewStore.viewSettings.paneInView === "node-editor"
            ? true
            : false,
      },
      show_variables: {
        enabled: windowType === "project" ? true : false,
        checked:
          viewStore && viewStore.viewSettings.paneInView === "variables"
            ? true
            : false,
      },
      toggle_preview: {
        enabled: windowType === "project" ? true : false,
        text:
          viewStore && viewStore.viewSettings.previewVisible === true
            ? "Hide Preview"
            : "Show Preview",
      },
    },
    project: {
      new_cell: {
        enabled: windowType === "project" ? true : false,
      },
      new_branch: {
        enabled: windowType === "project" ? true : false,
      },
      set_link: {
        enabled:
          windowType === "project" && viewStore.selectedNodes.length > 0
            ? true
            : false,
      },
      disconnect_link: {
        enabled:
          windowType === "project" && viewStore.selectedNodes.length > 0
            ? true
            : false,
      },
      delete_nodes: {
        enabled:
          windowType === "project" &&
          viewStore &&
          viewStore.selectedNodes.length > 0 &&
          viewStore.selectedNodes[0].type !== "start"
            ? true
            : false,
      },
      delete_stem: {
        enabled:
          viewStore &&
          viewStore.selectedStem !== false &&
          viewStore.selectedStem.type !== "noMatch"
            ? true
            : false,
      },
      open_in_browser: {
        enabled: windowType === "project" ? true : false,
      },
      project_settings: {
        enabled: windowType === "project" ? true : false,
      },
    },
  };
  const menu = fns.menus[windowType];
  if (!menu) {
    console.error(`No menu found for window kind: ${windowType}`);
    return;
  }
  const ids: Array<SubmenuId> = ["app", "file", "edit", "view", "project"];
  ids.forEach(async (id) => {
    const submenu = (await menu.get(`${id}_submenu`)) as Submenu;
    const commands = states[id];
    if (!submenu || !commands) {
      console.error(`No submenu or commands found for this id:`, id);
      return;
    }
    const stateKeys = Object.keys(commands);
    stateKeys.forEach(async (keyName) => {
      const item = (await submenu.get(keyName)) as MenuItem;
      const state = commands[keyName];
      if (!item || !state) {
        console.warn(
          `No item or state found for this submenu and commands:`,
          submenu,
          commands
        );
        return;
      }
      if (typeof state.enabled !== "undefined") {
        await item.setEnabled(state.enabled);
      }
    });
  });
  if (platform === "macos") {
    menu.setAsAppMenu();
    // On macOS, show the menu in all windows
    if (platform === "macos") {
      emit("add-native-menus");
    }
  } else if (
    (platform === "windows" || platform === "linux") &&
    windowType === "project"
  ) {
    menu.setAsWindowMenu();
  }
}
