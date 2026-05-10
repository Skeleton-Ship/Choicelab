import { invoke } from "@tauri-apps/api/core";
import {platform as getPlatform} from "@tauri-apps/plugin-os";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { resolve, basename } from "@tauri-apps/api/path";

export default async function loadProject(projectFilePath: string) {
  const projectPath = await resolve(projectFilePath, "../");
  const projectPathEncoded = encodeURIComponent(projectPath);
  const fileName = await basename(projectFilePath);
  const platform = await getPlatform();
  const fileNameEncoded = encodeURIComponent(fileName);
  const label = getProjectWindowLabel(projectPath);
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  invoke("create_project_window", {
    label,
    url: `index.html?window_type=project&project_path=${projectPathEncoded}&file_name=${fileNameEncoded}`,
    width: screenWidth - screenWidth / 12,
    height: screenHeight - screenWidth / 12,
    transparent: platform === "macos",
  }).catch((e) => console.error(e));
}
