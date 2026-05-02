import { render } from "preact";
import Launcher from "./launcher/Launcher";
import { WhatsNew } from "./whats-new/WhatsNew";
import { Acknowledgments } from "./acknowledgments/Acknowledgments";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { message, confirm, save, ask } from "@tauri-apps/plugin-dialog";
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
import { stringify } from "./utils/stringify";
import { Project, LoadError, WindowType } from "./typings";
import "./styles/_style.scss";
import { getProjectWindowLabel } from "./utils/getProjectWindowLabel";
import { createWebDir } from "./fs/createWebDir";
import { setAccentColor } from "./utils/setAccentColor";
import { listen, emit, once } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import loadProject from "./fs/loadProject";
import {
  needsMigration,
  migrateProject,
  normalizeProjectMetadata,
} from "./fs/migrateProject";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { open } from "@tauri-apps/plugin-shell";
import { setMenu } from "./menu/setMenu";
import openProject from "./fs/openProject";
import { buildMenu } from "./menu/buildMenu";
import { exportProject, getExportDirName } from "./fs/exportProject";
import { desktopDir, resolve } from "@tauri-apps/api/path";
const platform = getPlatform();
const appWindow = getCurrentWebviewWindow();
let assetsScanShown = false;

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
  window.addEventListener("focus", async () => {
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
  // TODO: Narrow scope of all three listeners to just the current appWindow
  // And for #3 specifically, remove the focus handler
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
  listen("menu-export-project", async () => {
    const vs = getViewStore();
    const defaultName = getExportDirName(vs.projectName);
    const defaultPath = await resolve(await desktopDir(), defaultName);
    if (windowType !== "project" && windowType !== "projectSettings") return;
    const exportDir = await save({
      defaultPath: defaultPath, // e.g. "my-project"
    });
    if (exportDir) {
      exportProject(exportDir);
    }
  });
  listen("menu-open-help", async () => {
    const focused = await appWindow.isFocused();
    if (!focused) return;
    const url = "https://choicelab.xyz/docs/";
    await open(url);
  });
  listen("menu-open-choicelab-site", async () => {
    const focused = await appWindow.isFocused();
    if (!focused) return;
    const url = "https://choicelab.xyz";
    await open(url);
  });
  listen("menu-report-issue", async () => {
    const focused = await appWindow.isFocused();
    if (!focused) return;
    const url = "https://github.com/Skeleton-Ship/Choicelab/issues";
    await open(url);
  });
  listen("menu-open-repo", async () => {
    const focused = await appWindow.isFocused();
    if (!focused) return;
    const url = "https://github.com/Skeleton-Ship/Choicelab";
    await open(url);
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
      acknowledgments: null,
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

  // Cold-start: retrieve any files that were queued before this listener was ready.
  // invoke is request/response so it always arrives regardless of listen() timing.
  if (windowType === "launcher") {
    invoke<string[]>("get_pending_files").then((files) => {
      const filePath = files[0];
      if (filePath?.endsWith(".clx")) {
        loadProject(filePath);
      }
    });
  }

  let elements = <></>;

  // Determine component to load
  if (windowType === "launcher") {
    elements = <Launcher />;
  }
  if (windowType === "whatsNew") {
    elements = <WhatsNew />;
  }
  if (windowType === "acknowledgments") {
    elements = <Acknowledgments />;
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
    // Migrate legacy projects that predate the asset registry
    if (windowType === "project" && needsMigration(projectData)) {
      const titleWindows = "Project Update Required";
      const messageText1 =
        "This project needs to be updated for this version of Choicelab.";
      const messageText2 =
        "Once updated, this project can't be opened in older versions.";
      const confirmed = await confirm(
        platform === "macos" ? messageText2 : messageText1 + " " + messageText2,
        {
          title: platform === "macos" ? messageText1 : titleWindows,
          okLabel: "Update",
          cancelLabel: "Cancel",
        }
      );
      if (!confirmed) {
        appWindow.close();
        return;
      }
      projectData = migrateProject(projectData);
      await new Promise<void>((resolveSave) => {
        once("migration-saved", () => resolveSave());
        emit("save-text-file", {
          name: fileName,
          contents: stringify(projectData as Project),
          path: projectPath,
          callback: "migration-saved",
          label: getProjectWindowLabel(projectPath),
        });
      });
    }
    // Warn about files in Assets that aren't registered in the project
    if (
      windowType === "project" &&
      Array.isArray(projectData.assets) &&
      !assetsScanShown
    ) {
      assetsScanShown = true;
      const assetsPath = await resolve(projectPath, "Assets");
      const diskEntries = await invoke<string[]>("list_assets_dir", {
        path: assetsPath,
      });
      const knownFileNames = new Set(projectData.assets.map((a) => a.fileName));
      const outliers = diskEntries.filter((name) => !knownFileNames.has(name));
      if (outliers.length > 0) {
        const bulletList = outliers.map((name) => `• ${name}`).join("\n");
        const headline =
          "Some files in the Assets folder aren't part of this project.";
        const detail = `To avoid issues, move these files out of the Assets folder:\n\n${bulletList}`;
        const openFolder = await ask(
          platform === "macos" ? detail : `${headline}\n\n${detail}`,
          {
            title:
              platform === "macos"
                ? headline
                : "Unexpected Files in Assets Folder",
            okLabel: "Open Assets Folder",
            cancelLabel: "Ignore",
          }
        );
        if (openFolder) {
          invoke("open_folder", { path: assetsPath });
        }
      }
    }
    // Normalize legacy metadata fields
    projectData = normalizeProjectMetadata(projectData as Project);
    // Always derive project name from the actual file name so renames are reflected
    (projectData as Project).name = fileName.replace(/\.clx$/i, "");
    // Create data store
    createDataStore(projectData, projectPath, fileName);
    createViewStore(projectPath, projectData.name);
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
  buildMenu(windowType);
}

init();
