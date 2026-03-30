import { v4 as uuidv4 } from "uuid";
import { Cell, Branch, Stem, Rule, StartNode, Asset } from "../typings";
import { createPlayerSettings } from "../player/createPlayerSettings";

function createCell(): Cell {
  const cellSettings = createPlayerSettings("cell");
  const cell = {
    id: uuidv4(),
    type: "cell",
    label: "",
    actions: [],
    settings: {
      player: {
        [cellSettings.id]: cellSettings.settings,
      },
    },
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
    rules: [createRule()],
    link: {
      to: "",
    },
  };
  return stem;
}

function createRule(): Rule {
  const rule = {
    id: uuidv4(),
    type: "variable",
    variableId: "",
    operator: "",
    value: "",
  };
  return rule;
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

function createAsset(fileName: string, type: Asset["type"]): Asset {
  return {
    id: uuidv4(),
    fileName: fileName,
    type: type,
  };
}

export { createCell, createBranch, createBranchStem, createRule, createStart, createAsset };
