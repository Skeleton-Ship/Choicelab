import { WebviewWindow } from "@tauri-apps/api/window";

export default function loadProject(projectPath: string) {
  const projectPathEncoded = encodeURIComponent(projectPath);
  const webview = new WebviewWindow("project", {
    url: `index.html?window_type=project&project_path=${projectPathEncoded}`,
    title: "",
    titleBarStyle: "overlay",
    width: 1000,
    height: 700,
  });
  webview.once("tauri://created", function () {});
  // webview.once("tauri://error", function () {});
}
