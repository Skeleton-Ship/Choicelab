import { getFonts } from "../fonts/fonts";
import { PlayerFontStyle } from "../typings";

function fontIsLoaded(id: string) {
  const styles = document.querySelector("#player-fonts");
  if (!styles) return false;
  let loaded = false;
  if (!styles.hasAttribute("data-fonts-loaded")) return false;
  const loadedFontsRaw = styles.getAttribute("data-fonts-loaded") as string;
  const loadedFonts = loadedFontsRaw.split(",");
  loadedFonts.forEach((font) => {
    if (id === font) {
      loaded = true;
    }
  });
  return loaded;
}

function addLoadedFont(id: string): void {
  const styles = document.querySelector("#player-fonts");
  if (!styles) {
    console.error("No style tag exists.");
    return;
  }
  if (!styles.hasAttribute("data-fonts-loaded")) {
    styles.setAttribute("data-fonts-loaded", "");
  }
  const loadedFontsRaw = styles.getAttribute("data-fonts-loaded") as string;
  const loadedFonts = loadedFontsRaw === "" ? [] : loadedFontsRaw.split(",");
  loadedFonts.push(id);
  styles.setAttribute("data-fonts-loaded", loadedFonts.toString());
}

export async function loadPlayerFonts() {
  // Get or create style tag
  let fontStyles = document.querySelector("#player-fonts");
  if (!fontStyles) {
    fontStyles = document.createElement("style");
    fontStyles.setAttribute("id", "player-fonts");
    fontStyles.setAttribute("data-fonts-loaded", "");
    document.head.appendChild(fontStyles);
  }
  const fonts = await getFonts();
  // Load fonts
  const fontKeys = Object.keys(fonts.families);
  fontKeys.forEach((id) => {
    if (fontIsLoaded(id)) return;
    const family = fonts.families[id];
    family.styles.forEach(async (style: PlayerFontStyle) => {
      fontStyles.textContent += `
		@font-face {
			font-family: "${family.name}";
			src: url("${style.url.default}");
			${style.style ? `font-style: ${style.style};` : ``}
			${style.weight ? `font-weight: ${style.weight};` : ``}
		}
		`;
    });
    addLoadedFont(id);
  });
}
