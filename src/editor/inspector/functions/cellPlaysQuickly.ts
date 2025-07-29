import { getActionDef } from "./getActionDef";
import { Cell } from "../../../typings";

export function cellPlaysQuickly(cell: Cell) {
  let quickly = false,
    hasTimed = false,
    hasInput = false,
    hasMedia = false;
  cell.actions.forEach((action) => {
    const def = getActionDef(action);
    if (!def) {
      console.warn(`No action def found for ${action.name}:`, action);
      return;
    }
    if (def.timedElement === true) hasTimed = true;
    if (def.mediaElement === true) hasMedia = true;
    if (def.inputElement === true) hasInput = true;
  });
  if (hasTimed && !hasMedia && !hasInput) {
    quickly = true;
  }
  return quickly;
}
