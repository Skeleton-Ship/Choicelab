import { Cell } from "./typings-project";
import { error } from "./logging";

export function getSettings(node: Cell): { [key: string]: any } | false {
  if (typeof node.settings !== "undefined") {
    return node.settings.player["choicelab-player-html5"];
  } else {
    error(`This node is missing settings:`, node);
    return false;
  }
}
