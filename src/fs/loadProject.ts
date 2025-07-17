import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { resolve, basename } from "@tauri-apps/api/path";

export default async function loadProject(projectFilePath: string) {
  const projectPath = await resolve(projectFilePath, "../");
  const projectPathEncoded = encodeURIComponent(projectPath);
  const fileName = await basename(projectFilePath);
  const fileNameEncoded = encodeURIComponent(fileName);
  const label = getProjectWindowLabel(projectPath);
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  const webview = new WebviewWindow(label, {
    url: `index.html?window_type=project&project_path=${projectPathEncoded}&file_name=${fileNameEncoded}`,
    title: "",
    titleBarStyle: "overlay",
    width: screenWidth - screenWidth / 12,
    height: screenHeight - screenWidth / 12,
    minWidth: 700,
    minHeight: 360,
    transparent: true,
    visible: true,
  });
  webview.once("tauri://created", function () {});
  webview.once("tauri://error", function (e) {
    console.log(e);
  });
}
