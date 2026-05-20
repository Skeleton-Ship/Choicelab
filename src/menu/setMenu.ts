import { emit } from "@tauri-apps/api/event";
import { canUndo, canRedo } from "../data/history";
import { getViewStore } from "../data/dataStore";
import { WindowType } from "../typings";

type SubmenuId = "app" | "file" | "edit" | "view" | "project";

type SubmenuState = {
  [K in SubmenuId]?: {
    [key: string]: {
      enabled?: boolean;
      checked?: boolean;
      text?: string;
    };
  };
};

export async function setMenu(windowType: WindowType = "project") {
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
      save_as: {
        enabled: windowType === "project" ? true : false,
      },
      export: {
        enabled:
          windowType === "project" || windowType === "projectSettings"
            ? true
            : false,
      },
    },
    edit: {
      undo: {
        enabled:
          windowType === "project" || windowType === "projectSettings"
            ? canUndo()
            : false,
      },
      redo: {
        enabled:
          windowType === "project" || windowType === "projectSettings"
            ? canRedo()
            : false,
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
      autofill: {
        enabled:
          windowType === "project" &&
          viewStore &&
          viewStore.autoGenerateLabel !== null,
        text:
          (viewStore && viewStore.autoGenerateLabel) ?? "Autofill Variables",
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
          windowType === "project" &&
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
  const menuIds: Array<SubmenuId> = ["app", "file", "edit", "view", "project"];
  menuIds.forEach(async (menuId) => {
    const commands = states[menuId];
    if (!commands) {
      console.error(`No commands found for this menu id:`, menuId);
      return;
    }
    const stateKeys = Object.keys(commands);
    stateKeys.forEach(async (keyName) => {
      const state = commands[keyName];
      if (!state) {
        console.warn(
          `No item or state found for this submenu and commands:`,
          menuId,
          commands
        );
        return;
      }
      emit("set-menu-item-state", {
        submenu: menuId + "_submenu",
        id: keyName,
        enabled: state.enabled !== undefined ? state.enabled : undefined,
        checked: state.checked !== undefined ? state.checked : undefined,
        text: state.text ? state.text : undefined,
      });
    });
  });
}
