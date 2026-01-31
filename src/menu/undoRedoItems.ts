import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { handleUndoRedo } from "../data/history";
const appWindow = getCurrentWebviewWindow();

export async function undoItem(update: Function) {
  const focused = await appWindow.isFocused();
  if (focused === false) return;
  handleUndoRedo("undo", update);
}

export async function redoItem(update: Function) {
  const focused = await appWindow.isFocused();
  if (focused === false) return;
  handleUndoRedo("redo", update);
}
