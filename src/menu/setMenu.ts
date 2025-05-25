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
import { saveProject } from "../fs/saveProject";
import openProject from "../fs/openProject";
import inTextElement from "../utils/inTextElement";
import showPane from "../editor/inspector/functions/showPane";
import { createCell, createBranch } from "../data/createNode";
import insertNewNode from "../editor/flowchart/general/insertNewNode";
import { emit } from "@tauri-apps/api/event";
import enterTargetMode from "../editor/flowchart/target-mode/enterTargetMode";
import handleDisconnectLinks from "../editor/flowchart/general/handleDisconnectLinks";
import { handleDeleteNodes } from "../editor/flowchart/general/handleDelete";
import { getStemParent } from "../data/getData";
import { Branch } from "../typings";
import { handleDeleteStem } from "../editor/flowchart/general/handleDelete";

/* 
 * Create and update the app-wide menu.
 
   Which items are enabled is based on a few factors, but primarily the global data store, as well as the optional `windowState` argument. Without that argument, it defaults to the menu items that should be on when a project is in view, because that's where setMenu is most frequently invoked.
 */
export async function setMenu(windowState?: string) {
  const fns = window.__CHOICELAB_FUNCTIONS__;
  const update = fns.updateProject;
  const store = getStore();

  /*
   * App menu
   */
  const aboutItem = await MenuItem.new({
    id: "about",
    text: "About Choicelab",
    action: () => {},
  });
  aboutItem.setEnabled(false);
  let quit = await MenuItem.new({
    id: "request-quit",
    text: "Quit Choicelab",
    accelerator: "Cmd+Q",
    action: () => {
      /* Emit a request to quit, responded to in MainEditor
       */
      emit("menu-request-quit");
      /*
	   SIDE NOTE: There's an argument to be made that some of the `action` props in other menu items in this function could do the same thing, just emit requests, and put the function body wherever else it's best suited. (Stuff that calls the main React `update` handler, in particular.) But until setMenu gets too unwieldy, this approach is fine.
	   */
    },
  });
  if (windowState === "launcher") {
    // @ts-ignore
    quit = await PredefinedMenuItem.new({
      text: "Quit Choicelab",
      item: "Quit",
    });
  }
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
      quit,
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
            windowState === "launcher" ? "launcher" : store.projectPath;
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
   * Project menu
   */

  const newCell = await MenuItem.new({
    id: "new_cell",
    text: "New Cell",
    accelerator: "Cmd+N",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const newCell = createCell();
      insertNewNode(newCell, update);
    },
  });
  newCell.setEnabled(windowState !== "launcher" ? true : false);

  const newBranch = await MenuItem.new({
    id: "new_branch",
    text: "New Branch",
    accelerator: "Cmd+B",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const newBranch = createBranch();
      insertNewNode(newBranch, update);
    },
  });
  newBranch.setEnabled(windowState !== "launcher" ? true : false);

  const setLink = await MenuItem.new({
    id: "set_link",
    text: "Set Link",
    accelerator: "Cmd+L",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      enterTargetMode({
        update: update,
      });
    },
  });
  const disconnectLink = await MenuItem.new({
    id: "disconnect_link",
    text: "Disconnect Link",
    accelerator: "Cmd+D",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleDisconnectLinks(update);
    },
  });
  let linkItemsEnabled = false;
  if (windowState !== "launcher" && store.selectedNodes.length > 0) {
    linkItemsEnabled = true;
  }
  setLink.setEnabled(linkItemsEnabled);
  disconnectLink.setEnabled(linkItemsEnabled);

  const deleteNodes = await MenuItem.new({
    id: "delete_nodes",
    text: "Delete Node",
    accelerator: "Cmd+Delete",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleDeleteNodes(update);
    },
  });
  let deleteEnabled = false;
  if (windowState !== "launcher" && store.selectedNodes.length > 0) {
    if (store.selectedNodes[0].type !== "start") {
      deleteEnabled = true;
    }
  }
  deleteNodes.setEnabled(deleteEnabled);

  const deleteStem = await MenuItem.new({
    id: "delete_stem",
    text: "Delete Branch Stem",
    accelerator: "Cmd+Option+Delete",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const store = getStore();
      const selectedStem = store.selectedStem;
      if (selectedStem !== false) {
        const parentBranch: Branch | undefined = getStemParent(
          selectedStem.id,
          store
        );
        if (parentBranch && selectedStem.type !== "noMatch") {
          handleDeleteStem(selectedStem.id, parentBranch.id, update);
        }
      }
    },
  });
  let deleteStemEnabled = false;
  const selectedStem = store.selectedStem;
  if (selectedStem !== false && selectedStem.type !== "noMatch") {
    deleteStemEnabled = true;
  }
  deleteStem.setEnabled(deleteStemEnabled);

  const projectSubmenu = await Submenu.new({
    text: "Project",
    items: [
      newCell,
      newBranch,
      await PredefinedMenuItem.new({
        item: "Separator",
      }),
      setLink,
      disconnectLink,
      await PredefinedMenuItem.new({
        item: "Separator",
      }),
      deleteNodes,
      deleteStem,
    ],
  });

  /*
   * Set the menu
   */
  const menu = await Menu.new({
    items: [appSubmenu, fileSubmenu, editSubmenu, viewSubmenu, projectSubmenu],
  });

  menu.setAsAppMenu();
}
