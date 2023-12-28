import { v4 as uuidv4 } from "uuid";
import { Cell, Branch, Stem, StartNode } from "../typings";

function createCell(): Cell {
  const cell = {
    id: uuidv4(),
    type: "cell",
    label: "",
    actions: [],
    media: { type: "" },
    link: {
      to: "",
    },
  };
  return cell;
}

function createBranch(): Branch {
  const branch = {
    id: uuidv4(),
    type: "branch",
    stems: [createBranchStem("noMatch")],
  };
  return branch;
}

function createBranchStem(
  type: string = "noMatch",
  match: string = "all"
): Stem {
  const stem = {
    id: uuidv4(),
    type: type,
    match: match,
    conditions: [],
    link: {
      to: "",
    },
  };
  return stem;
}

function createStart(): StartNode {
  const start = {
    id: uuidv4(),
    type: "start",
    link: {
      to: "",
    },
  };
  return start;
}

export { createCell, createBranch, createBranchStem, createStart };
