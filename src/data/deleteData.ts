import { getBranch } from "./getData";
import {
  Store,
  Sequence,
  AnyNode,
  Stem,
  Branch,
  Action,
  Variable,
} from "../typings";

function deleteSequenceFromData(sequenceId: string, store: Store) {
  const project = store.project;
  let correctSequenceIndex: number | false = false;
  // Find sequence
  let sequenceIndex: number = 0;
  project.sequences.forEach((sequence: Sequence) => {
    if (sequence.id === sequenceId) {
      correctSequenceIndex = sequenceIndex;
    }
    sequenceIndex++;
  });
  // Delete it
  if (correctSequenceIndex !== false) {
    project.sequences.splice(correctSequenceIndex, 1);
  }
  return store;
}

function deleteVariableFromData(variableId: string, store: Store) {
  const variables = store.project.variables;
  let correctVariableIndex: number | false = false;
  // Find sequence
  let variableIndex: number = 0;
  variables.items.forEach((variable: Variable) => {
    if (variable.id === variableId) {
      correctVariableIndex = variableIndex;
    }
    variableIndex++;
  });
  // Delete it
  if (correctVariableIndex !== false) {
    variables.items.splice(correctVariableIndex, 1);
  }
  return store;
}

function deleteNodeFromData(nodeId: string, store: Store) {
  const project = store.project;
  let correctSequenceIndex: number | false = false,
    correctNodeIndex: number | false = false;
  // Find sequence + node
  let sequenceIndex: number = 0;
  project.sequences.forEach((sequence: Sequence) => {
    let nodeIndex: number = 0;
    sequence.nodes.forEach((node: AnyNode) => {
      if (node.id === nodeId) {
        correctSequenceIndex = sequenceIndex;
        correctNodeIndex = nodeIndex;
      }
      nodeIndex++;
    });
    sequenceIndex++;
  });
  // Delete it
  if (correctSequenceIndex !== false && correctNodeIndex !== false) {
    project.sequences[correctSequenceIndex].nodes.splice(correctNodeIndex, 1);
  }
  return store;
}

function deleteStemFromData(stemId: string, branchId: string, store: Store) {
  const branch: Branch | undefined = getBranch(branchId, store);
  if (typeof branch === "undefined") {
    console.error("No branch found.");
    return store;
  }
  let correctStemIndex: number | false = false,
    stemIndex: number = 0;
  branch.stems.forEach((stem: Stem) => {
    if (stem.id === stemId) {
      correctStemIndex = stemIndex;
    }
    stemIndex++;
  });
  if (correctStemIndex !== false) {
    branch.stems.splice(correctStemIndex, 1);
  }
  return store;
}

function deleteActionFromData(actionId: string, nodeId: string, store: Store) {
  const project = store.project;
  let correctSequenceIndex: number | false = false,
    correctNodeIndex: number | false = false,
    correctActionIndex: number | false = false;
  // Find sequence + node
  let sequenceIndex: number = 0;
  project.sequences.forEach((sequence: Sequence) => {
    let nodeIndex: number = 0;
    sequence.nodes.forEach((node: AnyNode) => {
      if (node.id === nodeId) {
        correctSequenceIndex = sequenceIndex;
        correctNodeIndex = nodeIndex;
        if (!node.actions) return;
        let actionIndex = 0;
        node.actions.forEach((action: Action) => {
          if (action.id === actionId) {
            correctActionIndex = actionIndex;
          }
          actionIndex++;
        });
      }
      nodeIndex++;
    });
    sequenceIndex++;
  });
  // Delete it
  if (
    correctSequenceIndex !== false &&
    correctNodeIndex !== false &&
    correctActionIndex !== false
  ) {
    const thisNode =
      project.sequences[correctSequenceIndex].nodes[correctNodeIndex];
    if (thisNode.actions) {
      thisNode.actions.splice(correctActionIndex, 1);
    }
  }
  return store;
}

export {
  deleteSequenceFromData,
  deleteVariableFromData,
  deleteNodeFromData,
  deleteStemFromData,
  deleteActionFromData,
};
