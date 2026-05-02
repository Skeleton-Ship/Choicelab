import { save } from "@tauri-apps/plugin-dialog";
import { sep, resolve } from "@tauri-apps/api/path";
import { emit, once } from "@tauri-apps/api/event";
import createProjectFile from "../data/createProjectFile";
import loadProject from "./loadProject";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";

export default async function newProject(source: string) {
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
    console.error("Could not get project path from save.");
  } else {
    // Get project name
    const pathComponents = projectPath.split(sep());
    const projectName = pathComponents[pathComponents.length - 1];
    // Get parent path
    let parentPathComponents = pathComponents;
    parentPathComponents.length = parentPathComponents.length - 1;
    const parentPath = parentPathComponents.join(sep());
    // Create project path
    once("project-dir-created", async () => {
      // Create sub directories
      emit("create-directory", {
        name: "Assets",
        path: projectPath,
        label: label,
      });
      // Create project.clx
      const projectFileContents = await createProjectFile(projectName);
      if (!projectFileContents || projectFileContents === "") {
        console.error("Project file could not be generated.");
        return;
      }
      emit("save-text-file", {
        name: `${projectName}.clx`,
        contents: projectFileContents,
        path: projectPath,
        callback: "project-file-created",
        label: label,
      });
      // Load the project
      once("project-file-created", async () => {
        loadProject(await resolve(projectPath, `${projectName}.clx`));
      });
    });
    emit("create-directory", {
      name: projectName,
      path: parentPath,
      callback: "project-dir-created",
      label: label,
    });
  }
}
