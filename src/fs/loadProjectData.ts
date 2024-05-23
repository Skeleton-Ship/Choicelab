import { resolve } from "@tauri-apps/api/path";
import { emit } from "@tauri-apps/api/event";
import { Project, LoadError } from "../typings";

function parseRawData(iteration: number): Project | LoadError {
  const dataRaw: string | undefined = window.__CHOICELAB_DATA_RAW__;
  if (dataRaw) {
    if (dataRaw !== "__INVALID_CHOICELAB_FILE__") {
      try {
        let data = JSON.parse(dataRaw);
        return data;
      } catch (e) {
        return {
          error: "badJSON",
        };
      }
    }
  } else {
    if (iteration < 500) {
      return parseRawData(iteration + 1);
    }
  }
  // Default behavior
  return {
    error: "other",
  };
}

export default async function loadProjectData(
  projectPath: string
): Promise<Project | LoadError> {
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
