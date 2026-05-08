type AccentColorspace =
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "graphite";

interface AccentColor {
  200: string;
  400: string;
  600: string;
  800: string;
  full: string;
  contrast: string;
  vivid: string;
}

const colors: Record<AccentColorspace, AccentColor> = {
  blue: {
    200: "#C0DFFF",
    400: "#92C7FF",
    600: "#6DAEFD",
    800: "#4195FD",
    full: "#027BFF",
    contrast: "#005ABC",
    vivid: "#0B93FF",
  },
  purple: {
    200: "#F2C6F3",
    400: "#DF96E0",
    600: "#C65FC8",
    800: "#B739B9",
    full: "#B000B3",
    contrast: "#900092",
    vivid: "#D900DD",
  },
  pink: {
    200: "#FFCDE5",
    400: "#FFA1CD",
    600: "#FF7DBA",
    800: "#F261A5",
    full: "#F74F9D",
    contrast: "#D2327C",
    vivid: "#FF459A",
  },
  red: {
    200: "#F9D5D8",
    400: "#F39A9D",
    600: "#E97175",
    800: "#E44F55",
    full: "#E0383E",
    contrast: "#BD141A",
    vivid: "#FF4152",
  },
  orange: {
    200: "#FCD6B1",
    400: "#FBC18F",
    600: "#F9A75E",
    800: "#F79640",
    full: "#F7821B",
    contrast: "#D76500",
    vivid: "#FF7D0A",
  },
  yellow: {
    200: "#FFEFBF",
    400: "#F5D280",
    600: "#F3C455",
    800: "#F5C229",
    full: "#FFC002",
    contrast: "#DAA300",
    vivid: "#FFC825",
  },
  green: {
    200: "#D5ECCD",
    400: "#B0DCA2",
    600: "#92CF7E",
    800: "#7DC564",
    full: "#62BA46",
    contrast: "#419826",
    vivid: "#50D127",
  },
  graphite: {
    200: "#E7E7E7",
    400: "#D5D5D5",
    600: "#B8B8B8",
    800: "#A0A0A0",
    full: "#989898",
    contrast: "#656565",
    vivid: "#9C9C9C",
  },
};

export function getSystemColor(input: string): AccentColorspace {
  let color: AccentColorspace = "blue";
  // Blue
  const blue = ["rgba(0, 122, 255, 1)", "#007AFF"];
  if (blue.includes(input)) color = "blue";
  // Purple
  const purple = ["rgba(149, 61, 150, 1)", "rgba(165, 80, 167, 1)"];
  if (purple.includes(input)) color = "purple";
  // Pink
  const pink = ["rgba(247, 79, 158, 1)"];
  if (pink.includes(input)) color = "pink";
  // Red
  const red = ["rgba(224, 56, 62, 1)", "rgba(255, 82, 87, 1)"];
  if (red.includes(input)) color = "red";
  // Orange
  const orange = ["rgba(247, 130, 27, 1)"];
  if (orange.includes(input)) color = "orange";
  // Yellow
  const yellow = ["rgba(255, 199, 38, 1)", "rgba(255, 198, 0, 1)"];
  if (yellow.includes(input)) color = "yellow";
  // Green
  const green = ["rgba(98, 186, 70, 1)"];
  if (green.includes(input)) color = "green";
  // Graphite
  const graphite = ["rgba(152, 152, 152, 1)", "rgba(140, 140, 140, 1)"];
  if (graphite.includes(input)) color = "graphite";
  return color;
}

export function setAccentColor(input?: string) {
  const systemColor = getSystemColor(input ? input : "#007AFF");
  const accents = colors[systemColor];
  let accentColorEl = document.querySelector("#accent-color-styles");
  if (!accentColorEl) {
    accentColorEl = document.createElement("style");
    accentColorEl.setAttribute("id", "accent-color-styles");
  }
  // TODO: Fill out accent color values
  accentColorEl.textContent = `
	:root { 
		--accent-color: ${accents["full"]};
		--accent-color-200: ${accents["200"]};
		--accent-color-400: ${accents["400"]};
		--accent-color-600: ${accents["600"]};
		--accent-color-800: ${accents["800"]};
		--accent-color-contrast: ${accents["contrast"]};
		--accent-color-vivid: ${accents["vivid"]};
	}
	`;
  document.head.appendChild(accentColorEl);
}
