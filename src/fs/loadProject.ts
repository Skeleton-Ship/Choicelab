import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";

export default function loadProject(projectPath: string) {
  const projectPathEncoded = encodeURIComponent(projectPath);
  const label = getProjectWindowLabel(projectPath);
  const webview = new WebviewWindow(label, {
    url: `index.html?window_type=project&project_path=${projectPathEncoded}`,
    title: "",
    titleBarStyle: "overlay",
    width: 1150,
    height: 700,
    minWidth: 600,
    minHeight: 360,
    transparent: true,
    visible: true,
  });
  webview.once("tauri://created", function () {});
  webview.once("tauri://error", function (e) {
    console.log(e);
  });
}
