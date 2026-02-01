import { render } from "preact";
import Launcher from "./launcher/Launcher";
import { WhatsNew } from "./whats-new/WhatsNew";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { message } from "@tauri-apps/plugin-dialog";
import loadProjectData from "./fs/loadProjectData";
import { ProjectSettings } from "./editor/ProjectSettings";
import newProject from "./fs/newProject";
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
import { Project, LoadError, WindowType } from "./typings";
import "./styles/_style.scss";
import { getProjectWindowLabel } from "./utils/getProjectWindowLabel";
import { createWebDir } from "./fs/createWebDir";
import { setAccentColor } from "./utils/setAccentColor";
import { listen } from "@tauri-apps/api/event";
import loadProject from "./fs/loadProject";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { buildMenu } from "./menu/buildMenu";
import { setMenu } from "./menu/setMenu";
import openProject from "./fs/openProject";
const platform = getPlatform();
const appWindow = getCurrentWebviewWindow();

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const windowType: WindowType = urlParams.get("window_type") as any;
  // Set accent color
  if (platform === "macos") {
    const { accentColor } = await import("tauri-plugin-accent-color");
    accentColor.subscribe((color: string) => {
      setAccentColor(color);
    });
  } else {
    setAccentColor();
  }
  // Window focus
  window.addEventListener("focus", () => {
    if (!document.hasFocus()) return;
    document.querySelector("#App")?.setAttribute("data-focus", "true");
    // Update view store
    const viewStore = getViewStore();
    if (viewStore) {
      viewStore.focus = true;
      setViewStore(viewStore);
    }
    // Update menu
    setMenu(windowType);
  });
  window.addEventListener("blur", async () => {
    document.querySelector("#App")?.setAttribute("data-focus", "false");
    const viewStore = getViewStore();
    if (viewStore) {
      viewStore.focus = false;
      setViewStore(viewStore);
    }
  });
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
  // Global menu listeners
  listen("menu-new-project", () => {
    if (windowType !== "project" && windowType !== "launcher") return;
    const source =
      windowType === "project" ? getViewStore().projectPath : windowType;
    newProject(source);
  });
  listen("menu-open-project", () => {
    if (windowType !== "project" && windowType !== "launcher") return;
    openProject();
  });

  window.__CHOICELAB_FUNCTIONS__ = {
    updateProject: () => {},
    updateView: () => {},
    // Note: These live here because the data and view stores don't preserve classes and functions
    menus: {
      project: null,
      projectSettings: null,
      launcher: null,
      whatsNew: null,
    },
  };

  listen("opened-files", async (event) => {
    if (Array.isArray(event.payload)) {
      const filePath = event.payload[0];
      if (filePath.endsWith(".clx")) {
        loadProject(filePath);
      }
    }
  });

  let elements = <></>;

  // Determine component to load
  if (windowType === "launcher") {
    elements = <Launcher />;
  }
  if (windowType === "whatsNew") {
    elements = <WhatsNew />;
  }
  if (windowType === "project" || windowType === "projectSettings") {
    // Get project path
    const projectPathRaw: string = urlParams.get("project_path") || "";
    const fileNameRaw: string = urlParams.get("file_name") || "";
    const projectPath = decodeURIComponent(projectPathRaw);
    const fileName = decodeURIComponent(fileNameRaw);
    if (projectPath === "" || fileName === "") {
      console.error("No project found.");
      return;
    }
    // Load project data
    let projectData = await loadProjectData(
      projectPath,
      fileName,
      windowType === "projectSettings" ? "settings" : undefined
    );
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
      await message(contents, title);
      appWindow.close();
      return;
    }
    projectData = projectData as Project;
    // Create data store
    createDataStore(projectData, projectPath, fileName);
    createViewStore(projectPath);
    // Load store
    const store = getStore(),
      viewStore = getViewStore();
    setStore(store);
    // Load label
    const label = getProjectWindowLabel(
      store.projectPath,
      windowType === "projectSettings" ? "settings" : undefined
    );
    if (windowType === "project") {
      // Load the default sequence
      viewStore.currentSequenceId = store.project.sequences[0].id;
      setViewStore(viewStore);
      // Save initial history version
      saveHistoryVersion(true);
      // Create editor
      elements = <MainEditor />;
      // Create web folder
      createWebDir(label);
    } else if (windowType === "projectSettings") {
      const pane = urlParams.get("pane") as "general" | "appearance";
      elements = <ProjectSettings startingPane={pane} />;
    }
  }

  // Build menu
  const appDOM = (
    <div id="App" data-platform={platform} data-focused-region="">
      {elements}
    </div>
  );
  const root = document.getElementById("root") as HTMLElement;
  render(appDOM, root);
  await buildMenu(windowType);
  listen("set-menu", async () => {
    const focused = await appWindow.isFocused();
    if (!focused) return;
    setMenu(windowType);
  });
}

init();
