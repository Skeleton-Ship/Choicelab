import { v4 as uuidv4 } from "uuid";

function createCell() {
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

function createBranch() {
  const branch = {
    id: uuidv4(),
    type: "branch",
    evaluator: {
      type: "varName",
      name: "",
    },
    stems: [createBranchStem("noMatch")],
  };
  return branch;
}

function createBranchStem(linkType = "value") {
  const stem = {
    id: uuidv4(),
    type: linkType,
    value: "",
    link: {
      to: "",
    },
  };
  return stem;
}

function createStart() {
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
