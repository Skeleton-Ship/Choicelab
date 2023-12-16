import { Project } from "../typings";
import { v4 as uuidv4 } from "uuid";
import createSequence from "./createSequence";

export default function createProjectFile(name: string) {
  const blankProject: Project = {
    name: name,
    id: uuidv4(),
    actions: {
      name: "__CHOICELAB_STANDARD__",
      path: "__INTERNAL__",
    },
    variables: {},
    sequences: [createSequence()],
  };
  const blankProjectStr = JSON.stringify(blankProject);
  return blankProjectStr;
}
