import { getPlayerConfig } from "./getPlayerConfig";

export function createPlayerSettings(type: "project" | "cell", key?: string) {
  const config = getPlayerConfig();
  let settings: { [key: string]: any } = {};
  const defs =
    type === "project"
      ? config.projectSettings.settings
      : config.nodeSettings.cell;
  if (typeof key !== "undefined") {
    // @ts-ignore
    settings[key] = defs[key].default;
  } else {
    const defKeys = Object.keys(defs);
    defKeys.forEach((key) => {
      // @ts-ignore
      settings[key] = defs[key].default;
    });
  }
  return {
    id: config.id,
    settings: settings,
  };
}
