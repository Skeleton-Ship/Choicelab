import {
  getSequence,
  getNode,
  getBranchStem,
  getActiveBranchStem,
  getStemParent,
} from "../../../data/getData";
import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../../../data/dataStore";
import identifyOriginLink from "../linking/identifyOriginLink";
import { AnyNode } from "../../../typings";

/**
 * Handler for inserting a newly created node into the current sequence.
 *
 * @param {string} newNode - The node object to be added to the sequence
 * @param {Function} update - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function insertNewNode(newNode: AnyNode, update: Function) {
  // Add the new node to the sequence
  const store = getStore(),
    viewStore = getViewStore();
  const thisSequence = getSequence(viewStore.currentSequenceId, store);
  if (typeof thisSequence === "undefined") {
    console.error("No sequence found to insert node to.");
    return;
  }
  thisSequence.nodes.push(newNode);
  // Update origin node with link to new node
  let linkInData: AnyNode | undefined;
  const originLink = identifyOriginLink(store);
  // Use the right function to find the originating node
  if (originLink) {
    // With cells, it's easy...
    if (originLink.link === undefined) {
      console.error("Origin link not found.");
      return;
    }
    if (originLink.type === "cell" || originLink.type === "start") {
      linkInData = getNode(originLink.link.id, store);
    } else if (originLink.type === "branchStem") {
      // ...but branch stems are weird, because you have to find the parent branch and THEN find the stem again in the data
      const stemParent = getStemParent(originLink.link.id, store);
      if (typeof stemParent === "undefined") {
        console.error("Stem parent not found.");
        return;
      }
      linkInData = getBranchStem(originLink.link.id, stemParent.id, store);
    }
    // If the current node has a link, move it to the new node
    if (typeof linkInData === "undefined" || linkInData.link === undefined) {
      console.error("No link found.");
      return;
    }
    if (linkInData.link.to !== "") {
      if (newNode.type === "cell") {
        if (newNode.link !== undefined) {
          newNode.link.to = linkInData.link.to;
        }
      } else if (newNode.type === "branch") {
        const activeStem = getActiveBranchStem(newNode.id, store);
        if (typeof activeStem === "undefined") {
          console.error("No branch stem found");
          return;
        }
        activeStem.link.to = linkInData.link.to;
      }
    }
    linkInData.link.to = newNode.id;
  }
  // Update selection to new node
  viewStore.selectedNodes = [newNode];
  // Update data
  setStore(store);
  setViewStore(viewStore);
  update();
}
