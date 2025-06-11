import { render } from "preact";
import Launcher from "./launcher/Launcher";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit, once } from "@tauri-apps/api/event";
import { message } from "@tauri-apps/plugin-dialog";
import loadProjectData from "./fs/loadProjectData";
import MainEditor from "./editor/MainEditor";
import {
  getStore,
  setStore,
  createDataStore,
  getViewStore,
  setViewStore,
  createViewStore,
} from "./data/dataStore";
import { saveHistoryVersion } from "./data/history";
import { setFocusedRegion } from "./utils/focusedRegion";
import { Project, LoadError } from "./typings";
import "./styles/_style.scss";
import { getProjectWindowLabel } from "./utils/getProjectWindowLabel";
import { createWebDir } from "./fs/createWebDir";

const appWindow = getCurrentWebviewWindow();

async function init() {
  // Region focus listeners
  window.addEventListener("pointerdown", (e) => {
    const targetEl = e.target as HTMLElement;
    setFocusedRegion(targetEl);
  });
  window.addEventListener("keyup", () => {
    if (document.activeElement !== null) {
      setFocusedRegion(document.activeElement);
    }
  });

  window.__CHOICELAB_FUNCTIONS__ = {
    updateProject: () => {},
    updateView: () => {},
  };

  let elements = <></>;

  const urlParams = new URLSearchParams(window.location.search);
  const windowType: string | null = urlParams.get("window_type");
  if (windowType === "launcher") {
    elements = <Launcher />;
  }
  if (windowType === "project") {
    // Get project path
    const projectPathRaw: string = urlParams.get("project_path") || "";
    const projectPath = decodeURIComponent(projectPathRaw);
    if (projectPath === "") {
      console.error("No project path found.");
      return;
    }
    // Load project data
    let projectData = await loadProjectData(projectPath);
    if (projectData.hasOwnProperty("error")) {
      projectData = projectData as LoadError;
      let title = "",
        contents = "";
      switch (projectData.error) {
        case "badJSON":
          title = "The selected project couldn't be opened.";
          contents =
            "There may be an issue with the project file contents. Check to make sure the project file contains no incorrect characters, then try again.";
          break;
        default:
          title = "The selected folder couldn't be opened.";
          contents =
            "Make sure the selected folder is a Choicelab project folder downloaded to your computer, then try again.";
      }
      message(contents, title);
      appWindow.close();
      return;
    }
    projectData = projectData as Project;
    appWindow.show();
    // Create data store
    createDataStore(projectData, projectPath);
    createViewStore(projectPath);
    // Load store
    const store = getStore(),
      viewStore = getViewStore();
    const label = getProjectWindowLabel(store.projectPath);
    // Let Rust know that the project was opened
    emit("apply-window-treatment", {
      label: label,
    });
    // Load the default sequence
    viewStore.currentSequenceId = store.project.sequences[0].id;
    setStore(store);
    setViewStore(viewStore);
    // Save initial history version
    saveHistoryVersion(true);
    // Create editor
    elements = <MainEditor />;
    // Create web folder
    emit("create-directory", {
      name: ".web",
      path: projectPath,
      callback: "web-dir-created",
      overwrite: true,
      label: label,
    });
    once("web-dir-created", () => {
      createWebDir(projectPath, label);
    });
  }
  const appDOM = (
    <div id="App" data-focused-region="">
      {elements}
    </div>
  );
  const root = document.getElementById("root") as HTMLElement;
  render(appDOM, root);
}

init();
