import { WebviewWindow } from "@tauri-apps/api/window";

export default function loadProject(projectPath: string) {
  const projectPathEncoded = encodeURIComponent(projectPath);
  const webview = new WebviewWindow("project", {
    url: `index.html?window_type=project&project_path=${projectPathEncoded}`,
  });
  webview.once("tauri://created", function () {
    const launcher = WebviewWindow.getByLabel("launcher");
    if (launcher !== null) {
      if (launcher.hasOwnProperty("close")) {
        try {
          launcher.close();
        } catch (e) {
          console.error("Could not close launcher.");
          return;
        }
      }
    }
  });
  // webview.once("tauri://error", function () {});
}
