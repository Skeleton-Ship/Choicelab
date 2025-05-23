import {
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from "@tauri-apps/api/menu";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { handleUndoRedo } from "../data/history";
const appWindow = getCurrentWebviewWindow();
import { canUndo, canRedo } from "../data/history";
import { saveProject } from "./saveProject";

export async function setMenu(props: {
  enable?: Array<string>;
  disable?: Array<string>;
}) {
  const fns = window.__CHOICELAB_FUNCTIONS__;
  const update = fns.updateProject;
  console.log(props);
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
        text: "",
        item: "Separator",
      }),
      await PredefinedMenuItem.new({
        text: "Services",
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
        text: "Hide Others",
        item: "HideOthers",
      }),
      await PredefinedMenuItem.new({
        text: "",
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
    items: [save],
  });

  /*
   * Edit menu
   */

  // Undo
  const undo = await MenuItem.new({
    text: "Undo",
    accelerator: "Cmd+Z",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleUndoRedo("undo", update);
    },
  });
  undo.setEnabled(canUndo());

  // Redo
  const redo = await MenuItem.new({
    text: "Redo",
    accelerator: "Cmd+Shift+Z",
    action: async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleUndoRedo("redo", update);
    },
  });
  redo.setEnabled(canRedo());
  const editSubmenu = await Submenu.new({
    text: "Edit",
    items: [undo, redo],
  });

  /*
   * Set the menu
   */
  const menu = await Menu.new({
    items: [appSubmenu, fileSubmenu, editSubmenu],
  });

  menu.setAsAppMenu();
}
