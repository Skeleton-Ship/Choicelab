import { getViewStore, setViewStore } from "../../../data/dataStore";
import isObject from "../../../utils/isObject";
import { v4 as uuidv4 } from "uuid";
import { writeClipboardJson } from "../../../utils/clipboard";
import insertNewNode from "./insertNewNode";
import { handleDeleteNodes } from "./handleDelete";
import { upgradeRichTextProps } from "../../../fs/migrateProject";
import { AnyNode, Action, Cell, UpdateFunction } from "../../../typings";

/**
 * Given an object, regenerates the `id` property and clears the `link` property. This ensures that copy/pasted nodes won't have duplicate identifiers or dead links.
 *
 * Timed actions are keyed by action ID, so for cells, re-link them afterwards with relinkTimedActions().
 *
 * @param {object} obj - The object to check.
 */
function regenerateIdsAndLinks<T extends object>(node: T): T {
  const obj = node as Record<string, unknown> & Partial<Pick<Cell, "link">>;
  const keys = Object.keys(obj);
  keys.forEach((key: string) => {
    // Change ID
    if (key === "id") {
      obj[key] = uuidv4();
    }
    // Change link
    if (key === "link") {
      if (typeof obj.link === "undefined") return;
      if (typeof obj.link.to === "undefined") return;
      obj.link.to = "";
    }
    // Check nested props
    const value = obj[key];
    if (isObject(value)) {
      obj[key] = regenerateIdsAndLinks(value);
    }
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        var item = value[i];
        if (isObject(item)) {
          value[i] = regenerateIdsAndLinks(item);
        }
      }
    }
  });
  return node;
}

/**
 * After a pasted cell's action IDs are regenerated, re-keys each action's timed
 * actions to the new IDs, so timing within the cell is kept. Actions keep
 * their order, so old and new IDs pair up by position. Timing for anything
 * outside the cell is dropped.
 *
 * @param {Cell} cell - The pasted cell, with regenerated action IDs.
 * @param {Array<string>} oldActionIds - The cell's action IDs before regenerating, in order.
 */
function relinkTimedActions(cell: Cell, oldActionIds: Array<string>) {
  const newIds = new Map<string, string>();
  oldActionIds.forEach((oldId, i) => {
    const action = cell.actions[i];
    if (action) newIds.set(oldId, action.id);
  });
  cell.actions.forEach((action: Action) => {
    if (!action.timedActions) return;
    const timedActions: NonNullable<Action["timedActions"]> = {};
    Object.entries(action.timedActions).forEach(([oldId, timing]) => {
      const newId = newIds.get(oldId);
      if (newId) timedActions[newId] = timing;
    });
    action.timedActions = timedActions;
  });
}

/**
 * Clones an object and all of its properties, except for an excluded one.
 *
 * @param {object} obj - The object to clone.
 * @param {string} excludedProperty - The property to exclude (optional).
 */
function cloneObjectWithExclusion<T extends object>(
  obj: T,
  excludedProperty: string = ""
): T {
  const source = obj as Record<string, unknown>;
  const clonedObj: Record<string, unknown> = {};
  const keys = Object.keys(source);
  keys.forEach((key: string) => {
    if (key === excludedProperty) return;
    const value = source[key];
    if (isObject(value)) {
      clonedObj[key] = cloneObjectWithExclusion(value, excludedProperty);
    } else {
      clonedObj[key] = value;
    }
  });
  return clonedObj as T;
}

/**
 * Add the selected nodes to the clipboard. If cutting, delete the nodes from the sequence as well.
 *
 * @param {string} action - Whether it's a cut or a copy.
 * @param {UpdateFunction} update - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleCutCopy(action: string, update: UpdateFunction) {
  const viewStore = getViewStore();
  const inTextElement = viewStore.inTextElement;
  if (inTextElement === true) return;
  // Create the string sent to the clipboard, then write it
  const selectedNodes: Array<AnyNode> = [];
  viewStore.selectedNodes.forEach((node: AnyNode) => {
    if (node.type === "start") return;
    selectedNodes.push(node);
  });
  writeClipboardJson({ ChoicelabNodes: selectedNodes });
  // If cutting, delete the nodes from screen
  if (action === "cut") {
    handleDeleteNodes(update);
  }
}

/**
 * Checks clipboard contents for Choicelab nodes. If so, creates new nodes with fresh IDs and cleared links (keeping timing between a cell's actions), then runs `handleCreateNode` to add them to the current sequence.
 *
 * @param {object} data - The clipboard contents, parsed from JSON (see readClipboardJson()).
 * @param {UpdateFunction} update - A React handler that traverses back to the app root, triggering a refresh.
 */
function handlePaste(data: Record<string, unknown>, update: UpdateFunction): void {
  // If JSON didn't originate from Choicelab, ignore
  if (!Array.isArray(data.ChoicelabNodes)) return;
  const nodes = data.ChoicelabNodes as Array<AnyNode>;
  // Process nodes: remove the `position` prop, and re-generate IDs and links
  const processedNodes: Array<AnyNode> = [];
  nodes.forEach((node: AnyNode) => {
    // Clone node, removing the `position` prop
    let newNode = cloneObjectWithExclusion(node, "position");
    // Record action IDs first: regenerating changes them in place
    const oldActionIds =
      newNode.type === "cell" ? newNode.actions.map((action) => action.id) : [];
    newNode = regenerateIdsAndLinks(newNode);
    if (newNode.type === "cell") {
      relinkTimedActions(newNode, oldActionIds);
      // Nodes copied from an older version may have plain text where rich text is expected
      newNode.actions.forEach(upgradeRichTextProps);
    }
    processedNodes.push(newNode);
  });
  // Create new nodes — use a no-op so each insertion mutates the store
  // without saving a history entry; one entry is saved at the end.
  const noop = () => {};
  processedNodes.forEach((node: AnyNode) => {
    insertNewNode(node, noop);
  });
  // Finally, set selection to processed nodes and save one history entry
  const viewStore = getViewStore();
  viewStore.selectedNodes = processedNodes;
  setViewStore(viewStore);
  update();
}

export { handleCutCopy, handlePaste };
