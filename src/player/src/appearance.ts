export interface AppearanceSettings {
  headings?: {
    fontFamily?: string;
    fontStyle?: string;
    fontWeight?: string;
    color?: string;
    fontSize?: string;
  };
  subheadings?: {
    fontFamily?: string;
    fontStyle?: string;
    fontWeight?: string;
    color?: string;
    fontSize?: string;
  };
  bodyText?: {
    fontFamily?: string;
    fontStyle?: string;
    fontWeight?: string;
    color?: string;
    fontSize?: string;
  };
  inputs?: {
    fontFamily?: string;
    fontStyle?: string;
    fontWeight?: string;
    textColor?: string;
    backgroundColor?: string;
    fontSize?: string;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
  };
  background?: {
    kind?: string;
    file?: string;
    color?: string;
    size?: string;
  };
  customCSS?: string;
}

export function generateAppearanceCSS(appearance: AppearanceSettings, projectPath: string): string {
  const fontFallback = "var(--cl-font-family-base)";
  let css = ":root {\n";

  // Headings
  if (appearance.headings) {
    const h = appearance.headings;
    if (h.fontFamily) css += `  --cl-headings-font-family: ${h.fontFamily}, ${fontFallback};\n`;
    if (h.fontWeight) css += `  --cl-headings-font-weight: ${h.fontWeight};\n`;
    if (h.fontSize) css += `  --cl-headings-font-size: ${h.fontSize};\n`;
    if (h.color) css += `  --cl-headings-color: ${h.color};\n`;
  }

  // Subheadings
  if (appearance.subheadings) {
    const s = appearance.subheadings;
    if (s.fontFamily) css += `  --cl-subheadings-font-family: ${s.fontFamily}, ${fontFallback};\n`;
    if (s.fontWeight) css += `  --cl-subheadings-font-weight: ${s.fontWeight};\n`;
    if (s.fontSize) css += `  --cl-subheadings-font-size: ${s.fontSize};\n`;
    if (s.color) css += `  --cl-subheadings-color: ${s.color};\n`;
  }

  // Body text
  if (appearance.bodyText) {
    const b = appearance.bodyText;
    if (b.fontFamily) css += `  --cl-body-font-family: ${b.fontFamily}, ${fontFallback};\n`;
    if (b.fontWeight) css += `  --cl-body-font-weight: ${b.fontWeight};\n`;
    if (b.fontSize) css += `  --cl-body-font-size: ${b.fontSize};\n`;
    if (b.color) css += `  --cl-body-color: ${b.color};\n`;
  }

  // Inputs
  if (appearance.inputs) {
    const i = appearance.inputs;
    if (i.fontFamily) css += `  --cl-inputs-font-family: ${i.fontFamily}, ${fontFallback};\n`;
    if (i.fontWeight) css += `  --cl-inputs-font-weight: ${i.fontWeight};\n`;
    if (i.fontSize) css += `  --cl-inputs-font-size: ${i.fontSize};\n`;
    if (i.textColor) css += `  --cl-inputs-color: ${i.textColor};\n`;
    if (i.backgroundColor) css += `  --cl-inputs-background-color: ${i.backgroundColor};\n`;
    if (i.borderWidth !== undefined) css += `  --cl-inputs-border-width: ${i.borderWidth}px;\n`;
    if (i.borderColor) css += `  --cl-inputs-border-color: ${i.borderColor};\n`;
    if (i.borderRadius !== undefined) css += `  --cl-inputs-border-radius: ${i.borderRadius}px;\n`;
  }

  // Background
  if (appearance.background) {
    const bg = appearance.background;
    if (bg.color) css += `  --cl-background-color: ${bg.color};\n`;
    if (bg.file) css += `  --cl-background-image: url('${projectPath}/Assets/${bg.file}');\n`;
    if (bg.size) css += `  --cl-background-size: ${bg.size};\n`;
  }

  css += "}\n";

  // Font style overrides (no CSS variables exist for font-style)
  if (appearance.headings?.fontStyle) {
    css += `h1.cl-action { font-style: ${appearance.headings.fontStyle}; }\n`;
  }
  if (appearance.subheadings?.fontStyle) {
    css += `h2.cl-action { font-style: ${appearance.subheadings.fontStyle}; }\n`;
  }
  if (appearance.bodyText?.fontStyle) {
    css += `p.cl-action { font-style: ${appearance.bodyText.fontStyle}; }\n`;
  }
  if (appearance.inputs?.fontStyle) {
    css += `button.cl-action { font-style: ${appearance.inputs.fontStyle}; }\n`;
  }

  // Custom CSS
  if (appearance.customCSS) {
    css += appearance.customCSS;
  }

  return css;
}
