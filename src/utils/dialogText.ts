import { platform as getPlatform } from "@tauri-apps/plugin-os";

/*
 * Get platform-specific dialog text, since Windows and Mac have different conventions for what goes where
 */

export function getDialogText(title: string, line1: string, line2: string) {
  const platform = getPlatform();
  const platformTitle = platform === "macos" ? line1.trim() : title.trim();
  const platformMessage =
    platform === "macos" ? line2.trim() : `${line1.trim()} ${line2.trim()}`;
  return {
    title: platformTitle,
    message: platformMessage,
  };
}
