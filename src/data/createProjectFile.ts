import { getVersion } from "@tauri-apps/api/app";
import { Project } from "../typings";
import { v4 as uuidv4 } from "uuid";
import createSequence from "./createSequence";

export default async function createProjectFile(name: string) {
  const appVersion = await getVersion();
  const blankProject: Project = {
    name: name,
    id: uuidv4(),
    appVersion: appVersion,
    actions: {
      name: "__CHOICELAB_STANDARD__",
      path: "__INTERNAL__",
    },
    variables: {},
    sequences: [createSequence()],
  };
  const blankProjectStr = JSON.stringify(blankProject, null, 2);
  return blankProjectStr;
}
