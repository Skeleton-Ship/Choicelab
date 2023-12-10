import { getNode } from "./getData";

function deleteSequenceFromData(sequenceId: string, data: any) {
  let correctSequenceIndex: any = false;
  // Find sequence
  let sequenceIndex: number = 0;
  data.sequences.forEach((sequence: any) => {
    if (sequence.id === sequenceId) {
      correctSequenceIndex = sequenceIndex;
    }
    sequenceIndex++;
  });
  // Delete it
  if (correctSequenceIndex !== false) {
    data.sequences.splice(correctSequenceIndex, 1);
  }
  return data;
}

function deleteNodeFromData(nodeId: string, data: any) {
  let correctSequenceIndex: any = false,
    correctNodeIndex: any = false;
  // Find sequence + node
  let sequenceIndex: number = 0;
  data.sequences.forEach((sequence: any) => {
    let nodeIndex: number = 0;
    sequence.nodes.forEach((node: any) => {
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
    data.sequences[correctSequenceIndex].nodes.splice(correctNodeIndex, 1);
  }
  return data;
}

function deleteStemFromData(stemId: string, branchId: string, data: any) {
  const branch: any = getNode(branchId, data);
  let correctStemIndex: any = false,
    stemIndex: number = 0;
  branch.stems.forEach((stem: any) => {
    if (stem.id === stemId) {
      correctStemIndex = stemIndex;
    }
    stemIndex++;
  });
  if (correctStemIndex !== false) {
    branch.stems.splice(correctStemIndex, 1);
  }
  return data;
}

export { deleteSequenceFromData, deleteNodeFromData, deleteStemFromData };
