import { emit } from "@tauri-apps/api/event";
import { appCacheDir, resolve } from "@tauri-apps/api/path";
import { getFonts } from "../fonts/fonts";
import { getStore } from "../data/dataStore";
import { getPlayerSettings } from "../data/getData";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { PlayerFont } from "../typings";

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

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function collectFontFamilyNames(appearance: { [key: string]: any } | undefined): Set<string> {
  const names = new Set<string>();
  if (!appearance) return names;
  for (const key of ["headings", "subheadings", "bodyText", "inputs"] as const) {
    if (appearance[key]?.fontFamily) names.add(appearance[key].fontFamily);
  }
  return names;
}

export async function writeFontsToDir(targetPath: string, label?: string): Promise<void> {
  const store = getStore();
  const appearance = getPlayerSettings(store, "appearance") as
    | { [key: string]: any }
    | undefined;

  const fontFamilyNames = collectFontFamilyNames(appearance);
  const fontsPath = await resolve(targetPath, "fonts");

  if (fontFamilyNames.size === 0) {
    emit("save-text-file", { name: "fonts.css", contents: "", path: targetPath, label });
    return;
  }

  const fonts = await getFonts();
  const neededFamilies: PlayerFont[] = Object.values(fonts.families).filter(
    (f: PlayerFont) => fontFamilyNames.has(f.name)
  );

  emit("create-directory", { name: "fonts", path: targetPath, overwrite: true, label });

  let cssRules = "";
  for (const family of neededFamilies) {
    for (const style of family.styles) {
      const fontUrl: string = style.url.default;
      const filename = extractFilename(fontUrl);
      const format = getFontFormat(fontUrl);

      try {
        const response = await fetch(fontUrl);
        const buffer = await response.arrayBuffer();
        emit("save-binary-file", {
          name: filename,
          contents: arrayBufferToHex(buffer),
          path: fontsPath,
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
  const appearance = getPlayerSettings(store, "appearance") as
    | { [key: string]: any }
    | undefined;

  const fontFamilyNames = collectFontFamilyNames(appearance);
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
