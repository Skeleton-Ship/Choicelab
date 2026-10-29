import { Cell, CellSettings } from "../../schema/project";
import { error } from "./logging";

export function getSettings(node: Cell): CellSettings | false {
  if (typeof node.settings !== "undefined") {
    return node.settings;
  } else {
    error(`This node is missing settings:`, node);
    return false;
  }
}
