import { getVersion } from "@tauri-apps/api/app";
import { Project } from "../typings";
import { v4 as uuidv4 } from "uuid";
import { stringify } from "../utils/stringify";
import createSequence from "./createSequence";
import { CURRENT_SCHEMA_VERSION } from "../fs/migrateProject";
import { createProjectSettings } from "./settingsDefs";

export default async function createProjectFile(name: string) {
  const appVersion = await getVersion();
  const blankProject: Project = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name: name,
    id: uuidv4(),
    app: {
      creator: "Choicelab",
      version: appVersion,
    },
    settings: createProjectSettings(),
    actions: {
      name: "__CHOICELAB_STANDARD__",
      path: "__INTERNAL__",
    },
    variables: {
      items: [],
    },
    assets: [],
    sequences: [createSequence()],
  };
  const blankProjectStr = stringify(blankProject);
  return blankProjectStr;
}
