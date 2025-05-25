import {
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from "@tauri-apps/api/menu";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { handleUndoRedo } from "../data/history";
import newProject from "../fs/newProject";
import { getStore } from "../data/dataStore";
const appWindow = getCurrentWebviewWindow();
import { canUndo, canRedo } from "../data/history";
import { saveProject } from "./saveProject";
import openProject from "../fs/openProject";
import inTextElement from "../utils/inTextElement";
import showPane from "../editor/inspector/functions/showPane";

export async function setMenu(windowState?: string) {
  const fns = window.__CHOICELAB_FUNCTIONS__;
  const update = fns.updateProject;
  /*
   * App menu
   */
  const aboutItem = await MenuItem.new({
    id: "about",
    text: "About Choicelab",
    action: () => {},
  });
  aboutItem.setEnabled(false);
  const appSubmenu = await Submenu.new({
    text: "Choicelab",
    items: [
      aboutItem,
      await PredefinedMenuItem.new({
        item: "Separator",
      }),
      await PredefinedMenuItem.new({
        item: "Services",
      }),
      await PredefinedMenuItem.new({
        text: "",
        item: "Separator",
      }),
      await PredefinedMenuItem.new({
        text: "Hide Choicelab",
        item: "Hide",
      }),
      await PredefinedMenuItem.new({
        item: "HideOthers",
      }),
      await PredefinedMenuItem.new({
        item: "Separator",
      }),
      await PredefinedMenuItem.new({
        text: "Quit Choicelab",
        item: "Quit",
      }),
    ],
  });

  /*
   * File menu
   */

  const save = await MenuItem.new({
    text: "Save",
    accelerator: "Cmd+S",
    action: () => {
      saveProject();
    },
  });
  const fileSubmenu = await Submenu.new({
    text: "File",
    items: [
      await MenuItem.new({
        id: "new_project",
        text: "New Project...",
        accelerator: "Cmd+Shift+N",
        action: () => {
          const source =
            windowState === "launcher" ? "launcher" : getStore().projectPath;
          newProject(source);
        },
      }),
      await MenuItem.new({
        id: "open_project",
        text: "Open Project...",
        accelerator: "Cmd+O",
        action: () => {
          openProject();
        },
      }),
      await PredefinedMenuItem.new({
        item: "Separator",
      }),
      save,
      await PredefinedMenuItem.new({
        item: "Separator",
      }),
      await PredefinedMenuItem.new({
        text: "Close Window",
        item: "CloseWindow",
      }),
    ],
  });

  /*
   * Edit menu
   */

  // Undo
  let undo = await MenuItem.new({
    text: "Undo",
    accelerator: "Cmd+Z",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleUndoRedo("undo", update);
    },
  });
  const undoState = windowState === "launcher" ? false : canUndo();
  undo.setEnabled(undoState);
  if (inTextElement() === true) {
    // @ts-ignore
    undo = await PredefinedMenuItem.new({
      item: "Undo",
    });
  }

  // Redo
  let redo = await MenuItem.new({
    text: "Redo",
    accelerator: "Cmd+Shift+Z",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      if (inTextElement() === true) return;
      handleUndoRedo("redo", update);
    },
  });
  const redoState = windowState === "launcher" ? false : canRedo();
  redo.setEnabled(redoState);
  if (inTextElement() === true) {
    // @ts-ignore
    redo = await PredefinedMenuItem.new({
      item: "Redo",
    });
  }
  const editSubmenu = await Submenu.new({
    text: "Edit",
    items: [
      undo,
      redo,
      await PredefinedMenuItem.new({
        item: "Separator",
      }),
      await PredefinedMenuItem.new({
        item: "Cut",
      }),
      await PredefinedMenuItem.new({
        item: "Copy",
      }),
      await PredefinedMenuItem.new({
        item: "Paste",
      }),
      await PredefinedMenuItem.new({
        item: "SelectAll",
      }),
    ],
  });

  /*
   * View menu
   */

  const showNodeEditor = await MenuItem.new({
    id: "show_node_editor",
    text: "Show Node Editor",
    accelerator: "Cmd+E",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      showPane("node-editor", update);
    },
  });
  showNodeEditor.setEnabled(windowState !== "launcher" ? true : false);

  const showVariables = await MenuItem.new({
    id: "show_variables",
    text: "Show Variables",
    accelerator: "Cmd+R",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      showPane("variables", update);
    },
  });
  showVariables.setEnabled(windowState !== "launcher" ? true : false);

  const viewSubmenu = await Submenu.new({
    text: "View",
    items: [
      showNodeEditor,
      showVariables,
      await PredefinedMenuItem.new({
        item: "Separator",
      }),
    ],
  });

  /*
   * Set the menu
   */
  const menu = await Menu.new({
    items: [appSubmenu, fileSubmenu, editSubmenu, viewSubmenu],
  });

  menu.setAsAppMenu();
}
