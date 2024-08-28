import { getPlayerConfig } from "./getPlayerConfig";

export function getExtendedActionDefs() {
  const playerConfig = getPlayerConfig();
  const extendedActionDefs: any =
    playerConfig.actions.extends.__CHOICELAB__STANDARD__;
  if (extendedActionDefs) {
    return extendedActionDefs;
  }
  return {};
}
