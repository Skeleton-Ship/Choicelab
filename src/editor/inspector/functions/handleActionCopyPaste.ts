import structuredClone from "@ungap/structured-clone";
import { v4 as uuidv4 } from "uuid";
import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../../../data/dataStore";
import { getActionDef, getCell } from "../../../data/getData";
import { deleteActionFromData } from "../../../data/deleteData";
import { applyActionDefaults } from "../../../data/actionProps";
import { upgradeRichTextProps } from "../../../fs/migrateProject";
import { writeClipboardJson } from "../../../utils/clipboard";
import { getFocusedRegion } from "../../../utils/focusedRegion";
import inTextElement from "../../../utils/inTextElement";
import internalActionDefs from "./internalActionDefs";
import { markNewInspectorItem } from "./scrollToNewItem";
import { Action, Cell, Store, UpdateFunction } from "../../../typings";

/**
 * The cell selected in the flowchart, if exactly one cell is selected.
 */
function getSoleSelectedCell(store: Store): Cell | undefined {
  const selectedNodes = getViewStore().selectedNodes;
  if (selectedNodes.length !== 1 || selectedNodes[0].type !== "cell") return;
  return getCell(selectedNodes[0].id, store);
}

/**
 * The action selected in the inspector, along with its cell. Undefined if the
 * selected action no longer belongs to the selected cell (e.g. after undo, or
 * after selecting other nodes).
 */
function getSelectedAction(
  store: Store = getStore()
): { cell: Cell; action: Action } | undefined {
  const selectedActionId = getViewStore().selectedActionId;
  if (!selectedActionId) return;
  const cell = getSoleSelectedCell(store);
  const action = cell?.actions.find((a) => a.id === selectedActionId);
  if (!cell || !action) return;
  return { cell, action };
}

/**
 * Whether keyboard commands (copy, cut, delete) should apply to the selected
 * action rather than to nodes: the actions editor has focus, a text field
 * doesn't, and an action is selected.
 */
function shouldTargetSelectedAction(): boolean {
  return (
    getFocusedRegion() === "actions-editor" &&
    !inTextElement() &&
    getSelectedAction() !== undefined
  );
}

/**
 * Selects an action in the inspector (or clears the selection, with null).
 *
 * @param {UpdateFunction} update - Re-renders without recording history or
 *   updating the preview. Omit it when an update() call follows.
 */
function setSelectedActionId(id: string | null, update?: UpdateFunction) {
  const viewStore = getViewStore();
  if (viewStore.selectedActionId === id) return;
  viewStore.selectedActionId = id;
  setViewStore(viewStore);
  update?.(false, false);
}

/**
 * Whether the page has a text selection (e.g. drag-selected text in an
 * action's heading), which copy should copy instead of the action.
 */
function hasTextSelection(): boolean {
  const selection = window.getSelection();
  return !!selection && !selection.isCollapsed && selection.toString().trim() !== "";
}

type Timing = NonNullable<Action["timedActions"]>[string];
/** The clipboard's record of copied actions' timing, by copied action ID */
type CopiedTimings = Record<string, { parentId: string } & Timing>;

/**
 * Copies the selected action to the clipboard, along with its timing if
 * another action (e.g. media) times it. If cutting, deletes it as well.
 *
 * @returns Whether the action was copied. It isn't when text is selected, so
 *   the text can be copied instead.
 */
function handleActionCutCopy(type: "cut" | "copy", update: UpdateFunction): boolean {
  if (hasTextSelection()) return false;
  const selected = getSelectedAction();
  if (!selected) return false;
  const { cell, action } = selected;
  const timings: CopiedTimings = {};
  cell.actions.forEach((parent) => {
    const timing = parent.timedActions?.[action.id];
    if (timing) timings[action.id] = { parentId: parent.id, ...timing };
  });
  writeClipboardJson({ ChoicelabActions: [action], ChoicelabActionTimings: timings });
  if (type === "cut") handleDeleteSelectedAction(update);
  return true;
}

/**
 * Deletes an action from a cell. If it was the selected action, selects the
 * next one (or the previous, if it was last), so deleting again keeps
 * deleting actions rather than falling through to the cell.
 */
function deleteAction(actionId: string, cellId: string, update: UpdateFunction) {
  const store = getStore();
  const cell = getCell(cellId, store);
  if (!cell) return;
  const index = cell.actions.findIndex((a) => a.id === actionId);
  if (index === -1) return;
  if (getViewStore().selectedActionId === actionId) {
    const neighbor = cell.actions[index + 1] ?? cell.actions[index - 1];
    setSelectedActionId(neighbor?.id ?? null);
  }
  setStore(deleteActionFromData(actionId, cellId, store));
  update();
}

/**
 * Deletes the selected action.
 */
function handleDeleteSelectedAction(update: UpdateFunction) {
  const selected = getSelectedAction();
  if (!selected) return;
  deleteAction(selected.action.id, selected.cell.id, update);
}

/**
 * Whether clipboard contents hold Choicelab actions.
 */
function clipboardHasActions(data: Record<string, unknown>): boolean {
  return Array.isArray(data.ChoicelabActions) && data.ChoicelabActions.length > 0;
}

/**
 * Pastes actions from clipboard contents into the selected cell: below the
 * selected action, or at the end if none is selected. Pasted actions get fresh
 * IDs, and the last one becomes selected.
 *
 * Timing is kept where it still applies in the cell: a pasted media action
 * keeps timing for actions there that nothing else times (e.g. after cutting
 * and pasting it in the same cell), and a pasted timed action is re-timed by
 * its media action, if that's in the cell.
 *
 * @param {object} data - The clipboard contents, parsed from JSON (see readClipboardJson()).
 * @returns Whether anything was pasted.
 */
function handleActionPaste(
  data: Record<string, unknown>,
  update: UpdateFunction
): boolean {
  if (!clipboardHasActions(data)) return false;
  const store = getStore();
  const cell = getSoleSelectedCell(store);
  if (!cell) return false;
  // Copied ID -> pasted action
  const pasted = new Map<string, Action>();
  (data.ChoicelabActions as Array<Action>).forEach((copied) => {
    // Ignore anything that isn't a known action
    if (typeof copied !== "object" || copied === null) return;
    const actionDef = getActionDef(copied.name, internalActionDefs);
    if (!actionDef) return;
    const action = structuredClone(copied);
    action.id = uuidv4();
    if (typeof action.enabled !== "boolean") action.enabled = true;
    if (typeof action.props !== "object" || action.props === null) {
      action.props = {} as Action["props"];
    }
    // Actions copied from an older version may have plain text where rich
    // text is expected, or be missing newer props
    upgradeRichTextProps(action);
    applyActionDefaults(action, actionDef);
    pasted.set(copied.id, action);
  });
  if (pasted.size === 0) return false;
  const newActions = [...pasted.values()];
  // An action can only be timed by one other action
  const alreadyTimed = new Set<string>();
  cell.actions.forEach((a) => {
    Object.keys(a.timedActions ?? {}).forEach((id) => alreadyTimed.add(id));
  });
  // Pasted media actions: keep timing for actions pasted alongside them
  // (under their new IDs), or in this cell and not already timed
  newActions.forEach((action) => {
    if (!action.timedActions) return;
    const timedActions: NonNullable<Action["timedActions"]> = {};
    Object.entries(action.timedActions).forEach(([id, timing]) => {
      const pastedChild = pasted.get(id);
      if (pastedChild) {
        timedActions[pastedChild.id] = timing;
      } else if (cell.actions.some((a) => a.id === id) && !alreadyTimed.has(id)) {
        timedActions[id] = timing;
        alreadyTimed.add(id);
      }
    });
    action.timedActions = timedActions;
  });
  // Pasted timed actions: re-time them by their media action, if it's in this
  // cell (a media action pasted alongside was handled above)
  const timings = data.ChoicelabActionTimings;
  if (typeof timings === "object" && timings !== null) {
    Object.entries(timings as CopiedTimings).forEach(([copiedId, timing]) => {
      const child = pasted.get(copiedId);
      if (!child || pasted.has(timing.parentId)) return;
      const parent = cell.actions.find((a) => a.id === timing.parentId);
      if (!parent) return;
      parent.timedActions ||= {};
      parent.timedActions[child.id] = { start: timing.start, end: timing.end };
    });
  }
  const selectedActionId = getViewStore().selectedActionId;
  const selectedIndex = cell.actions.findIndex((a) => a.id === selectedActionId);
  const insertIndex = selectedIndex === -1 ? cell.actions.length : selectedIndex + 1;
  cell.actions.splice(insertIndex, 0, ...newActions);
  setStore(store);
  const lastNewId = newActions[newActions.length - 1].id;
  markNewInspectorItem(lastNewId);
  setSelectedActionId(lastNewId);
  update();
  return true;
}

export {
  shouldTargetSelectedAction,
  setSelectedActionId,
  handleActionCutCopy,
  handleDeleteSelectedAction,
  deleteAction,
  clipboardHasActions,
  handleActionPaste,
};
