import { getVersion } from "@tauri-apps/api/app";
import { Project } from "../typings";
import { v4 as uuidv4 } from "uuid";
import { stringify } from "../utils/stringify";
import createSequence from "./createSequence";
import { createPlayerSettings } from "../player/createPlayerSettings";

export default async function createProjectFile(name: string) {
  const appVersion = await getVersion();
  const playerSettings = createPlayerSettings("project");
  const blankProject: Project = {
    schemaVersion: 2,
    name: name,
    id: uuidv4(),
    app: {
      creator: "Choicelab",
      version: appVersion,
    },
    settings: {
      activePlayer: playerSettings.id,
      player: {
        [playerSettings.id]: playerSettings.settings,
      },
    },
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
