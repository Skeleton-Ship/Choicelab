import { v4 as uuidv4 } from "uuid";
import { createStart } from "./createNode";

export default function createSequence(label: string = "") {
  if (label === "") label = "New Sequence";
  const sequence = {
    id: uuidv4(),
    label: label,
    nodes: [createStart()],
  };
  return sequence;
}
