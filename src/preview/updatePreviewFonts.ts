import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { appCacheDir, resolve } from "@tauri-apps/api/path";
import { getFonts } from "../fonts/fonts";
import { getStore } from "../data/dataStore";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { AppearanceSettings, PlayerFont } from "../typings";

let lastFontFamilies = "";

function getFontFormat(url: string): string {
  if (url.includes(".woff2")) return "woff2";
  if (url.includes(".woff")) return "woff";
  if (url.includes(".ttf")) return "truetype";
  return "woff2";
}

function extractFilename(url: string): string {
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  return last.split("?")[0].split("#")[0];
}

function collectFontFamilyNames(appearance: AppearanceSettings): Set<string> {
  const names = new Set<string>();
  for (const key of ["headings", "subheadings", "bodyText", "inputs"] as const) {
    if (appearance[key].fontFamily) names.add(appearance[key].fontFamily);
  }
  return names;
}

export async function writeFontsToDir(targetPath: string, label?: string): Promise<void> {
  const store = getStore();
  const fontFamilyNames = collectFontFamilyNames(store.project.settings.appearance);
  const fontsPath = await resolve(targetPath, "fonts");

  if (fontFamilyNames.size === 0) {
    emit("save-text-file", { name: "fonts.css", contents: "", path: targetPath, label });
    return;
  }

  const fonts = await getFonts();
  const neededFamilies: PlayerFont[] = Object.values(fonts.families).filter(
    (f: PlayerFont) => fontFamilyNames.has(f.name)
  );

  // Awaited so the folder is cleared before any font files are written into it
  await emit("create-directory", { name: "fonts", path: targetPath, overwrite: true, label });

  let cssRules = "";
  for (const family of neededFamilies) {
    for (const style of family.styles) {
      const fontUrl: string = style.url.default;
      const filename = extractFilename(fontUrl);
      const format = getFontFormat(fontUrl);

      try {
        const response = await fetch(fontUrl);
        const buffer = await response.arrayBuffer();
        // Sent as the raw request body; header values must be ASCII
        await invoke("save_binary_file", new Uint8Array(buffer), {
          headers: {
            "x-file-name": encodeURIComponent(filename),
            "x-dir-path": encodeURIComponent(fontsPath),
          },
        });
        cssRules += `@font-face {
  font-family: "${family.name}";
  src: url("./fonts/${filename}") format("${format}");
  font-style: ${style.style};
  font-weight: ${style.weight};
}\n`;
      } catch (e) {
        console.error(`Failed to load font: ${fontUrl}`, e);
      }
    }
  }

  emit("save-text-file", { name: "fonts.css", contents: cssRules, path: targetPath, label });
}

export async function updatePreviewFonts(): Promise<void> {
  const store = getStore();
  const fontFamilyNames = collectFontFamilyNames(store.project.settings.appearance);
  const currentFamilies = Array.from(fontFamilyNames).sort().join(",");
  if (currentFamilies === lastFontFamilies) return;
  lastFontFamilies = currentFamilies;

  const label = getProjectWindowLabel(store.projectPath);
  const previewPath = await resolve(
    await appCacheDir(),
    "Projects",
    label,
    "Preview"
  );

  await writeFontsToDir(previewPath, label);
}
