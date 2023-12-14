import { getStore, setStore } from "../../../data/dataStore";
import isObject from "../../../utils/isObject";
import { v4 as uuidv4 } from "uuid";
import insertNewNode from "./insertNewNode";
import { handleDeleteNodes } from "./handleDelete";
import isJson from "../../../utils/isJson";
import { AnyNode } from "../../../typings";

/**
 * Given an object, regenerates the `id` property, and clears the `link` property. This ensures that copy/pasted nodes won't have duplicate identifiers or dead links.
 *
 * @param {object} obj - The object to check.
 */
function regenerateIdsAndLinks(obj: AnyNode) {
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
    // @ts-ignore
    const value = obj[key];
    if (isObject(value)) {
      // @ts-ignore
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
  return obj;
}

/**
 * Clones an object and all of its properties, except for an excluded one.
 *
 * @param {object} obj - The object to clone.
 * @param {string} excludedProperty - The property to exclude (optional).
 */
function cloneObjectWithExclusion(obj: any, excludedProperty: string = "") {
  const clonedObj: any = {};
  const keys = Object.keys(obj);
  keys.forEach((key: string) => {
    if (key === excludedProperty) return;
    const value: any = obj[key];
    if (isObject(value)) {
      clonedObj[key] = cloneObjectWithExclusion(value, excludedProperty);
    } else {
      clonedObj[key] = value;
    }
  });
  return clonedObj;
}

/**
 * Add the selected nodes to the clipboard. If cutting, delete the nodes from the sequence as well.
 *
 * @param {string} action - Whether it's a cut or a copy.
 * @param {Function} update - A React handler that traverses back to the app root, triggering a refresh.
 */
function handleCutCopy(action: string, update: Function) {
  const store = getStore();
  const inTextElement = store.inTextElement;
  if (inTextElement === true) return;
  // Create the string sent to the clipboard, then write it
  const selectedNodes = store.selectedNodes;
  let clipboardContents = {
    ChoicelabNodes: selectedNodes,
  };
  const clipboardStr: string = JSON.stringify(clipboardContents);
  const type = "text/plain";
  const blob = new Blob([clipboardStr], { type });
  const data = [new ClipboardItem({ [type]: blob })];
  navigator.clipboard.write(data);
  // If cutting, delete the nodes from screen
  if (action === "cut") {
    handleDeleteNodes(update);
  }
}

/**
 * Checks the clipboard for Choicelab nodes. If so, creates new nodes with fresh IDs and cleared links, then runs `handleCreateNode` to add them to the current sequence.
 *
 * @param {Function} update - A React handler that traverses back to the app root, triggering a refresh.
 */
function handlePaste(update: Function): void {
  navigator.clipboard.readText().then((clipText) => {
    // Ignore things that aren't JSON
    if (!isJson(clipText)) return;
    const data = JSON.parse(clipText);
    // If JSON didn't originate from Choicelab, ignore
    if (!data.ChoicelabNodes) return;
    const nodes = data.ChoicelabNodes;
    // Process nodes: remove the `position` prop, and re-generate IDs and links
    const processedNodes: Array<AnyNode> = [];
    nodes.forEach((node: AnyNode) => {
      // Clone node, removing the `position` prop
      let newNode = cloneObjectWithExclusion(node, "position");
      newNode = regenerateIdsAndLinks(newNode);
      processedNodes.push(newNode);
    });
    // Create new nodes
    processedNodes.forEach((node: AnyNode) => {
      insertNewNode(node, update);
    });
    // Finally, set selection to processed nodes
    const store = getStore();
    store.selectedNodes = processedNodes;
    setStore(store);
    update();
  });
}

export { handleCutCopy, handlePaste };
