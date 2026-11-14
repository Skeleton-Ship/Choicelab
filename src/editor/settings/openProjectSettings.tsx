import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { getProjectWindowLabel } from "../../utils/getProjectWindowLabel";
import { getStore } from "../../data/dataStore";
import { getProjectSettingsWindow } from "./getProjectSettingsWindow";
import { PANE_HEIGHTS } from "../ProjectSettings";

export async function openProjectSettings(
  pane: "general" | "appearance" = "general"
) {
  const store = getStore();
  const projectPath = store.projectPath;
  const fileName = store.projectFileName;
  const platform = getPlatform();
  const projectPathEncoded = encodeURIComponent(projectPath);
  const fileNameEncoded = encodeURIComponent(fileName);
  const label = getProjectWindowLabel(projectPath, "settings");
  const existingWindow = await getProjectSettingsWindow(label);
  if (existingWindow) {
    const visible = await existingWindow.isVisible();
    if (visible === false) {
      existingWindow.show();
    }
    existingWindow.setFocus();
    return;
  }
  const webview = new WebviewWindow(label, {
    url: `index.html?window_type=projectSettings&project_path=${projectPathEncoded}&file_name=${fileNameEncoded}&pane=${pane}`,
    title: "",
    width: 680,
    // Opens at the starting pane's size, so it doesn't resize as it appears
    height: PANE_HEIGHTS[pane],
    titleBarStyle: "overlay",
    transparent: platform === "macos" ? true : false,
    resizable: false,
    // Shown once its contents are ready (see emitWindowReady.ts)
    visible: false,
  });
  webview.once("tauri://created", function () {});
  webview.once("tauri://error", function (e) {
    console.error(e);
  });
}
