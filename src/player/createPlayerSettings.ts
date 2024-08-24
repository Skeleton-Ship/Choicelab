import { getPlayerConfig } from "./getPlayerConfig";

export function createPlayerProjectSettings() {
  const config = getPlayerConfig();
  let projectSettings: { [key: string]: any } = {};
  const defs = config.projectSettings.settings;
  const defKeys = Object.keys(defs);
  defKeys.forEach((key) => {
    // @ts-ignore
    projectSettings[key] = defs[key].default;
  });
  return {
    id: config.id,
    settings: projectSettings,
  };
}

export function createPlayerCellSettings() {
  const config = getPlayerConfig();
  let cellSettings: { [key: string]: any } = {};
  const defs = config.nodeSettings.cell;
  const defKeys = Object.keys(defs);
  defKeys.forEach((key) => {
    // @ts-ignore
    cellSettings[key] = defs[key].default;
  });
  return {
    id: config.id,
    settings: cellSettings,
  };
}
