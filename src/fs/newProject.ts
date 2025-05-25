import { save } from "@tauri-apps/plugin-dialog";
import { sep } from "@tauri-apps/api/path";
import { emit, listen } from "@tauri-apps/api/event";
import createProjectFile from "../data/createProjectFile";
import loadProject from "./loadProject";
import playerHTMLDefault from "@surfgreen/choicelab-player-html5/dist/index.html?raw";
import playerCSSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.css?raw";
import playerJSDefault from "@surfgreen/choicelab-player-html5/dist/choicelab.js?raw";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";

export default async function newProject(source: string) {
  const projectPath = await save({
    filters: [
      {
        name: "My Project",
        extensions: [""],
      },
    ],
  });
  const label =
    source === "launcher" ? "launcher" : getProjectWindowLabel(source);
  if (projectPath === null) {
  } else {
    // Get project name
    const pathComponents = projectPath.split(sep());
    const projectName = pathComponents[pathComponents.length - 1];
    // Get parent path
    let parentPathComponents = pathComponents;
    parentPathComponents.length = parentPathComponents.length - 1;
    const parentPath = parentPathComponents.join(sep());
    // Create project path
    emit("create-directory", {
      name: projectName,
      path: parentPath,
      callback: "project-dir-created",
      label: label,
    });
    listen("project-dir-created", async () => {
      console.log("Project dir created, doing the other stuff now", label);
      // Create sub directories
      emit("create-directory", {
        name: "assets",
        path: projectPath,
        label: label,
      });
      // Create project.json
      const projectFileContents = await createProjectFile(projectName);
      if (!projectFileContents || projectFileContents === "") {
        console.error("Project file JSON could not be generated.");
        return;
      }
      emit("save-text-file", {
        name: "project.json",
        contents: projectFileContents,
        path: projectPath,
        callback: "project-file-created",
        label: label,
      });
      // Load the project
      listen("project-file-created", () => {
        console.log(projectPath);
        loadProject(projectPath);
      });
      // Create web folder
      emit("create-directory", {
        name: ".web",
        path: projectPath,
        callback: "web-dir-created",
        label: label,
      });
      listen("web-dir-created", () => {
        emit("save-text-file", {
          name: "index.html",
          contents: playerHTMLDefault,
          path: projectPath + "/.web",
          label: label,
        });
        emit("save-text-file", {
          name: "choicelab.css",
          contents: playerCSSDefault,
          path: projectPath + "/.web",
          label: label,
        });
        emit("save-text-file", {
          name: "choicelab.js",
          contents: playerJSDefault,
          path: projectPath + "/.web",
          label: label,
        });
      });
    });
  }
}
