import structuredClone from "@ungap/structured-clone";
import { v4 as uuidv4 } from "uuid";
import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
  updateView,
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
 * @param {boolean} refresh - Whether to re-render. Pass false when an update() call follows.
 */
function setSelectedActionId(id: string | null, refresh: boolean = true) {
  const viewStore = getViewStore();
  if (viewStore.selectedActionId === id) return;
  viewStore.selectedActionId = id;
  setViewStore(viewStore);
  if (refresh) updateView();
}

/**
 * Copies the selected action to the clipboard. If cutting, deletes it as well.
 */
function handleActionCutCopy(type: "cut" | "copy", update: UpdateFunction) {
  const selected = getSelectedAction();
  if (!selected) return;
  writeClipboardJson({ ChoicelabActions: [selected.action] });
  if (type === "cut") handleDeleteSelectedAction(update);
}

/**
 * Deletes the selected action.
 */
function handleDeleteSelectedAction(update: UpdateFunction) {
  const store = getStore();
  const selected = getSelectedAction(store);
  if (!selected) return;
  setStore(deleteActionFromData(selected.action.id, selected.cell.id, store));
  setSelectedActionId(null, false);
  update();
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
  const newActions: Array<Action> = [];
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
    // Timed actions refer to other actions in the original cell
    delete action.timedActions;
    // Actions copied from an older version may have plain text where rich
    // text is expected, or be missing newer props
    upgradeRichTextProps(action);
    applyActionDefaults(action, actionDef);
    newActions.push(action);
  });
  if (newActions.length === 0) return false;
  const selectedActionId = getViewStore().selectedActionId;
  const selectedIndex = cell.actions.findIndex((a) => a.id === selectedActionId);
  const insertIndex = selectedIndex === -1 ? cell.actions.length : selectedIndex + 1;
  cell.actions.splice(insertIndex, 0, ...newActions);
  setStore(store);
  const lastNewId = newActions[newActions.length - 1].id;
  markNewInspectorItem(lastNewId);
  setSelectedActionId(lastNewId, false);
  update();
  return true;
}

export {
  getSelectedAction,
  shouldTargetSelectedAction,
  setSelectedActionId,
  handleActionCutCopy,
  handleDeleteSelectedAction,
  clipboardHasActions,
  handleActionPaste,
};
