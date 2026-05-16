import { getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";

// Add a prefix here for each new project-dependent window type.
const DEPENDENT_WINDOW_PREFIXES = ["project_settings_"];

export async function closeProjectDependentWindows(projectLabel: string) {
  const encodedPath = projectLabel.replace(/^project_/, "");
  const windows = await getAllWebviewWindows();
  for (const w of windows) {
    if (DEPENDENT_WINDOW_PREFIXES.some((p) => w.label === p + encodedPath)) {
      await w.close();
    }
  }
}
