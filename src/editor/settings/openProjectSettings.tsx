import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getProjectWindowLabel } from "../../utils/getProjectWindowLabel";
import { getStore } from "../../data/dataStore";
import { getProjectSettingsWindow } from "./getProjectSettingsWindow";

export async function openProjectSettings(
  pane: "general" | "appearance" = "general"
) {
  const store = getStore();
  const projectPath = store.projectPath;
  const fileName = store.projectFileName;
  const projectPathEncoded = encodeURIComponent(projectPath);
  const fileNameEncoded = encodeURIComponent(fileName);
  const label = getProjectWindowLabel(projectPath, "settings");
  const existingWindow = await getProjectSettingsWindow(label);
  if (existingWindow) {
    existingWindow.setFocus();
    return;
  }
  const webview = new WebviewWindow(label, {
    url: `index.html?window_type=projectSettings&project_path=${projectPathEncoded}&file_name=${fileNameEncoded}&pane=${pane}`,
    title: "",
    width: 680,
    height: 340,
    titleBarStyle: "overlay",
    transparent: false,
    resizable: false,
    visible: false,
  });
  webview.once("tauri://created", function () {});
  webview.once("tauri://error", function (e) {
    console.log(e);
  });
}
