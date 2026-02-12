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
  // Remove any query string or hash
  return last.split("?")[0].split("#")[0];
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export async function updatePreviewFonts(): Promise<void> {
  const store = getStore();
  const appearance = getPlayerSettings(store, "appearance") as
    | { [key: string]: any }
    | undefined;

  const label = getProjectWindowLabel(store.projectPath);
  const previewPath = await resolve(
    await appCacheDir(),
    "Projects",
    label,
    "Preview"
  );
  const fontsPath = await resolve(previewPath, "fonts");

  // Collect unique font family names from appearance settings
  const fontFamilyNames = new Set<string>();
  if (appearance) {
    const fontKeys = ["headings", "subheadings", "bodyText", "inputs"] as const;
    for (const key of fontKeys) {
      if (appearance[key]?.fontFamily) {
        fontFamilyNames.add(appearance[key].fontFamily);
      }
    }
  }

  // Early exit if font families haven't changed
  const currentFamilies = Array.from(fontFamilyNames).sort().join(",");
  if (currentFamilies === lastFontFamilies) return;
  lastFontFamilies = currentFamilies;

  // If no fonts configured, write empty fonts.css
  if (fontFamilyNames.size === 0) {
    emit("save-text-file", {
      name: "fonts.css",
      contents: "",
      path: previewPath,
      label: label,
    });
    return;
  }

  // Find matching families from the font registry
  const fonts = await getFonts();
  const familyKeys = Object.keys(fonts.families);
  const neededFamilies: PlayerFont[] = [];
  for (const key of familyKeys) {
    if (fontFamilyNames.has(fonts.families[key].name)) {
      neededFamilies.push(fonts.families[key]);
    }
  }

  // Clear and recreate the fonts directory
  emit("create-directory", {
    name: "fonts",
    path: previewPath,
    overwrite: true,
    label: label,
  });

  // Fetch and save each font file, build CSS rules
  let cssRules = "";
  for (const family of neededFamilies) {
    for (const style of family.styles) {
      const fontUrl: string = style.url.default;
      const filename = extractFilename(fontUrl);
      const format = getFontFormat(fontUrl);

      try {
        const response = await fetch(fontUrl);
        const buffer = await response.arrayBuffer();
        const hexString = arrayBufferToHex(buffer);

        // Save font file to Preview/fonts/
        emit("save-binary-file", {
          name: filename,
          contents: hexString,
          path: fontsPath,
        });

        // Add @font-face rule
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

  // Save fonts.css
  emit("save-text-file", {
    name: "fonts.css",
    contents: cssRules,
    path: previewPath,
    label: label,
  });
}
