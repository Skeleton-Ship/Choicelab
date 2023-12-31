import { resolve } from "@tauri-apps/api/path";
import { emit } from "@tauri-apps/api/event";
import { Project } from "../typings";

function parseRawData(iteration: number): Project | false {
  const dataRaw: string | undefined = window.__CHOICELAB_DATA_RAW__;
  if (dataRaw && dataRaw !== "__INVALID_CHOICELAB_FILE__") {
    const data = JSON.parse(dataRaw);
    return data;
  } else {
    if (iteration < 500) {
      return parseRawData(iteration + 1);
    }
  }
  return false;
}

export default async function loadProjectData(
  projectPath: string
): Promise<Project | false> {
  const dataPath = await resolve(projectPath, "project.json");
  emit("request-project-file", {
    path: dataPath,
  });
  return new Promise((resolveData) => {
    setTimeout(() => {
      const data = parseRawData(0);
      resolveData(data);
    }, 50);
  });
}
