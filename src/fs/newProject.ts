import { save } from "@tauri-apps/plugin-dialog";
import { sep, resolve } from "@tauri-apps/api/path";
import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import createProjectFile from "../data/createProjectFile";
import loadProject from "./loadProject";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import guardProjectWindow from "./guardProjectWindow";
import { showFileErrorMessage } from "./saveErrorDialog";

export default async function newProject(source: string) {
  if (!(await guardProjectWindow("create"))) return;
  const projectPath = await save({
    defaultPath: "My Project",
    filters: [
      {
        name: "Choicelab Project",
        extensions: [""],
      },
    ],
  });
  const label =
    source === "launcher" || source === "whatsNew"
      ? source
      : getProjectWindowLabel(source);
  if (projectPath === null) {
    emit("clear-pending-close", {});
    console.error("Could not get project path from save.");
  } else {
    // Get project name
    const pathComponents = projectPath.split(sep());
    const projectName = pathComponents[pathComponents.length - 1];
    const projectFileContents = await createProjectFile(projectName);
    if (!projectFileContents || projectFileContents === "") {
      emit("clear-pending-close", {});
      console.error("Project file could not be generated.");
      return;
    }
    // Writing the project file also creates its folder
    try {
      await invoke("save_project_file", {
        directory: projectPath,
        fileName: `${projectName}.clx`,
        contents: projectFileContents,
      });
    } catch (error) {
      // Keep the current project open, since the new one doesn't exist
      emit("clear-pending-close", {});
      await showFileErrorMessage(error, projectName, "Couldn't create project");
      return;
    }
    emit("create-directory", {
      name: "Assets",
      path: projectPath,
      label: label,
    });
    loadProject(await resolve(projectPath, `${projectName}.clx`));
  }
}
