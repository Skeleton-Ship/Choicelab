import { Sequence, Stem, Cell, Branch, AnyNode, Store } from "../typings";

function getSequence(id: string, data: Store): Sequence | undefined {
  let foundSequence;
  data.project.sequences.forEach((sequence: Sequence) => {
    if (sequence.id === id) {
      foundSequence = sequence;
    }
  });
  return foundSequence;
}

function getNode(id: string, data: Store): AnyNode | undefined {
  let foundNode;
  data.project.sequences.forEach((sequence: Sequence) => {
    const sequenceNodes = sequence.nodes;
    sequenceNodes.forEach((node: AnyNode) => {
      if (node.id === id) {
        foundNode = node;
      }
    });
  });
  return foundNode;
}

function getCell(id: string, data: Store): Cell | undefined {
  let foundNode;
  data.project.sequences.forEach((sequence: Sequence) => {
    const sequenceNodes = sequence.nodes;
    sequenceNodes.forEach((node: AnyNode) => {
      if (node.id === id && node.type === "cell") {
        foundNode = node as Cell;
      }
    });
  });
  return foundNode;
}

function getBranch(id: string, data: Store): Branch | undefined {
  let foundNode;
  data.project.sequences.forEach((sequence: Sequence) => {
    const sequenceNodes = sequence.nodes;
    sequenceNodes.forEach((node: AnyNode) => {
      if (node.id === id && node.type === "branch") {
        foundNode = node as Branch;
      }
    });
  });
  return foundNode;
}

function getActiveBranchStem(branchId: string, data: Store): Stem | undefined {
  let foundStem;
  const branch: AnyNode | undefined = getNode(branchId, data);
  if (typeof branch === "undefined") {
    console.error(
      `Could not get branch stem in this data with the ID ${branchId}`,
      { ...data }
    );
    return;
  }
  const selectedStem = data.selectedStem;
  // First, find the no-match branch
  if (typeof branch.stems === "undefined") {
    console.error("This node does not have a stems property:", branch);
    return;
  }
  branch.stems.forEach((stem: Stem) => {
    if (stem.type === "noMatch") {
      foundStem = stem;
    }
  });
  // Now, try to find the correct stem
  branch.stems.forEach((stem: Stem) => {
    if (selectedStem === false) return;
    if (typeof selectedStem.id === "undefined") return;
    if (stem.id === selectedStem.id) {
      foundStem = stem;
    }
  });
  return foundStem;
}

function getNoMatchStem(branchId: string, data: Store): Stem | undefined {
  let foundStem;
  const branch: AnyNode | undefined = getNode(branchId, data);
  if (typeof branch === "undefined") return;
  if (typeof branch.stems === "undefined") return;
  branch.stems.forEach((stem: Stem) => {
    if (stem.type === "noMatch") {
      foundStem = stem;
    }
  });
  return foundStem;
}

function getBranchStem(
  id: string,
  branchId: string,
  data: Store
): Stem | undefined {
  let foundStem;
  const branch: AnyNode | undefined = getNode(branchId, data);
  if (typeof branch === "undefined") {
    console.error("Branch stem not found.");
    return;
  }
  if (typeof branch.stems === "undefined") {
    return;
  }
  branch.stems.forEach((stem: Stem) => {
    if (stem.id === id) {
      foundStem = stem;
    }
  });
  return foundStem;
}

function getStemParent(stemId: string, data: Store): Branch | undefined {
  let foundBranch;
  const project = data.project;
  project.sequences.forEach((sequence: Sequence) => {
    sequence.nodes.forEach((node: AnyNode) => {
      if (node.type !== "branch") return;
      const stems = node.stems;
      if (typeof stems === "undefined") return;
      stems.forEach((stem: Stem) => {
        if (stem.id === stemId) {
          foundBranch = node;
        }
      });
    });
  });
  return foundBranch;
}

function getCurrentSequence(data: Store): Sequence | undefined {
  const currentSequenceId: string = data.currentSequenceId;
  return getSequence(currentSequenceId, data);
}

function nodeExists(id: string, data: Store) {
  const node: AnyNode | undefined = getNode(id, data);
  if (typeof node === "undefined") {
    return false;
  }
  return true;
}

export {
  getSequence,
  getNode,
  getCell,
  getBranch,
  getBranchStem,
  getActiveBranchStem,
  getStemParent,
  getNoMatchStem,
  getCurrentSequence,
  nodeExists,
};
