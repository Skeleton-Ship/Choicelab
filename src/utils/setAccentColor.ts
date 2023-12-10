import tinycolor from "tinycolor2";

export default function setAccentColor(color: string) {
  if (color.length === 8) {
    color = color.substring(0, 6);
    color = "#" + color;
  }
  const lightColor = tinycolor(color).brighten(0).toString();
  const darkColor = tinycolor(color).darken(10).toString();
  document.documentElement.style.setProperty("--accentColor", color);
  document.documentElement.style.setProperty(
    "--accentFadedColor",
    tinycolor(color).desaturate(10).toString()
  );
  document.documentElement.style.setProperty("--accentLightColor", lightColor);
  document.documentElement.style.setProperty(
    "--accentLightFadedColor",
    tinycolor(lightColor).desaturate(10).toString()
  );
  document.documentElement.style.setProperty("--accentDarkColor", darkColor);
  document.documentElement.style.setProperty(
    "--accentDarkFadedColor",
    tinycolor(darkColor).desaturate(10).toString()
  );
}
