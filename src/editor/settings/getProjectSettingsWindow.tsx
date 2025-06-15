import {
  getAllWebviewWindows,
  WebviewWindow,
} from "@tauri-apps/api/webviewWindow";

export async function getProjectSettingsWindow(
  label: string
): Promise<WebviewWindow | false> {
  const windows = await getAllWebviewWindows();
  for (let i = 0; i < windows.length; i++) {
    const thisWindow = windows[i];
    if (thisWindow.label === label) {
      return thisWindow;
    }
  }
  return false;
}
