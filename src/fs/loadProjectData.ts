import { resolve } from "@tauri-apps/api/path";
import { emit, emitTo, once } from "@tauri-apps/api/event";
import { Project, LoadError } from "../typings";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function parseRawData(iteration: number): Promise<Project | LoadError> {
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
    } else if (iteration < 600) {
      // If not instantly found, keep trying less often for 5 more seconds
      await delay(50);
      return parseRawData(iteration + 1);
    }
  }
  // Default behavior
  return {
    error: "other",
  };
}

function requestFromParent(
  projectPath: string,
  labelArgs: "settings" | "assets"
) {
  emitTo(getProjectWindowLabel(projectPath), "request-project-from-parent", {
    label: getProjectWindowLabel(projectPath, labelArgs),
  });
}

export default async function loadProjectData(
  projectPath: string,
  fileName: string,
  labelArgs?: "settings" | "assets"
): Promise<Project | LoadError> {
  // If loading SETTINGS, load most recent data from the parent window — NOT what's most recently saved to disk
  if (labelArgs && labelArgs === "settings") {
    requestFromParent(projectPath, labelArgs);
    // In a dev environment, where project settings and the main editor can be refreshed at the same time, the above request may fire before the window is reloaded.
    // In that case, wait for a set period of time, then try again when we're relatively confident the editor is open.
    // Worst-case scenario, the settings window is closed and has to re-open again.
    setTimeout(() => {
      if (!window.__CHOICELAB_DATA_RAW__) {
        requestFromParent(projectPath, labelArgs);
      }
    }, 200);
    once("receive-project-from-parent", (event) => {
      const payload = event.payload as { data: string };
      const data = payload.data;
      window.__CHOICELAB_DATA_RAW__ = data;
    });
  } else {
    // If loading EDITOR, load data from disk
    let dataPath = await resolve(projectPath, fileName);
    emit("request-project-file", {
      path: dataPath,
      label: getProjectWindowLabel(
        projectPath,
        labelArgs ? labelArgs : undefined
      ),
    });
  }
  return new Promise(async (resolveData) => {
    setTimeout(() => {
      parseRawData(0).then((data) => {
        resolveData(data);
      });
    }, 50);
  });
}
