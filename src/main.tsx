import { render } from "preact";
import Launcher from "./launcher/Launcher";
import { WhatsNew } from "./whats-new/WhatsNew";
import { Acknowledgments } from "./acknowledgments/Acknowledgments";
import { License } from "./license/License";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { message, confirm, save } from "@tauri-apps/plugin-dialog";
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
import markUnsaved from "./data/markUnsaved";
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
import { getDialogText } from "./utils/dialogText";
const platform = getPlatform();
const appWindow = getCurrentWebviewWindow();

function formatAutosaveTime(ms: number): string {
  const d = new Date(ms);
  const isToday = d.toDateString() === new Date().toDateString();
  const timeStr = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  if (isToday) return `at ${timeStr}`;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const yr = String(d.getFullYear()).slice(2);
  return `on ${m}/${day}/${yr} at ${timeStr}`;
}

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
  const reportFocusedWindow = () =>
    invoke("set_focused_window", { label: appWindow.label });
  // Window focus
  reportFocusedWindow();
  appWindow.listen("tauri://focus", async () => {
    document.querySelector("#App")?.setAttribute("data-focus", "true");
    // Update view store
    const viewStore = getViewStore();
    if (viewStore) {
      viewStore.focus = true;
      setViewStore(viewStore);
    }
    // Update menu
    setMenu(windowType);
    reportFocusedWindow();
  });
  appWindow.listen("tauri://blur", async () => {
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
  // Prevent bare Backspace/Delete from triggering WKWebView's built-in
  // back-navigation when focus is outside a text field.
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        const target = e.target as Element;
        const isEditable =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          (target as HTMLElement).isContentEditable;
        if (!isEditable) e.preventDefault();
      }
    },
    true
  );
  // Menu listeners - discard if the payload label doesn't match this window
  appWindow.listen<{ label: string }>("menu-new-project", (event) => {
    if (event.payload.label !== appWindow.label) return;
    const source =
      windowType === "project" ? getViewStore().projectPath : windowType;
    newProject(source);
  });
  appWindow.listen<{ label: string }>("menu-open-project", (event) => {
    if (event.payload.label !== appWindow.label) return;
    openProject();
  });
  appWindow.listen<{ label: string }>("menu-export-project", async (event) => {
    if (event.payload.label !== appWindow.label) return;
    const vs = getViewStore();
    const defaultName = getExportDirName(vs.projectName);
    const defaultPath = await resolve(await desktopDir(), defaultName);
    const exportDir = await save({
      defaultPath: defaultPath,
    });
    if (exportDir) {
      exportProject(exportDir);
    }
  });
  appWindow.listen<{ label: string }>("menu-open-help", async (event) => {
    if (event.payload.label !== appWindow.label) return;
    await open("https://choicelab.xyz/docs/");
  });
  appWindow.listen<{ label: string }>(
    "menu-open-choicelab-site",
    async (event) => {
      if (event.payload.label !== appWindow.label) return;
      await open("https://choicelab.xyz");
    }
  );
  appWindow.listen<{ label: string }>("menu-report-issue", async (event) => {
    if (event.payload.label !== appWindow.label) return;
    await open("https://github.com/Skeleton-Ship/Choicelab/issues");
  });
  appWindow.listen<{ label: string }>("menu-open-repo", async (event) => {
    if (event.payload.label !== appWindow.label) return;
    await open("https://github.com/Skeleton-Ship/Choicelab");
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
  if (windowType === "license") {
    elements = <License />;
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
    // Autosave recovery — check whether a newer autosaved version exists
    let loadedFromAutosave = false;
    if (windowType === "project") {
      try {
        const autosaveInfo = await invoke<{
          autosaveMtimeMs: number;
          savedMtimeMs: number;
        } | null>("check_autosave", { projectPath, fileName });
        if (autosaveInfo) {
          const projName = fileName.replace(/\.clx$/i, "");
          const autosaveStr = formatAutosaveTime(autosaveInfo.autosaveMtimeMs);
          const savedStr = formatAutosaveTime(autosaveInfo.savedMtimeMs);
          const dialogText = getDialogText(
            "Autosaved project found",
            `Choicelab auto-saved a version of "${projName}" ${autosaveStr}.`,
            `Do you want to open the auto-saved version, or the last version you saved ${savedStr}?`
          );
          const choseAutosave = await invoke<boolean>(
            "show_autosave_recovery_dialog",
            { title: dialogText.title, body: dialogText.message }
          );
          if (choseAutosave) {
            try {
              const autosaveContents = await invoke<string>(
                "read_autosave_file",
                { projectPath }
              );
              projectData = JSON.parse(autosaveContents) as Project;
              loadedFromAutosave = true;
            } catch {
              // corrupt autosave — fall through with the saved version
            }
          } else {
            invoke("delete_autosave", { projectPath }).catch(() => {});
          }
        }
      } catch {
        // autosave check failed — proceed with normal load
      }
    }
    // Migrate legacy projects that predate the asset registry
    if (windowType === "project" && needsMigration(projectData)) {
      const dialog = getDialogText(
        "Project update required",
        "This project needs to be updated for this version of Choicelab.",
        "Once updated, this project can't be opened in older versions."
      );
      const confirmed = await confirm(dialog.message, {
        title: dialog.title,
        okLabel: "Update",
        cancelLabel: "Cancel",
      });
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
      if (loadedFromAutosave) {
        markUnsaved();
      }
      // Create editor
      elements = <MainEditor />;
      // Create web folder
      createWebDir(label);
    } else if (windowType === "projectSettings") {
      const pane = urlParams.get("pane") as "general" | "appearance";
      elements = <ProjectSettings startingPane={pane} />;
    }
  }

  // Build menu with current recent files; rebuild whenever the list changes.
  const recentFiles = await invoke<string[]>("get_recent_files").catch(
    () => [] as string[]
  );

  listen("rebuild-open-recent-menu", async () => {
    const files = await invoke<string[]>("get_recent_files").catch(
      () => [] as string[]
    );
    buildMenu(windowType, files);
  });

  const appDOM = (
    <div id="App" data-platform={platform} data-focused-region="">
      {elements}
    </div>
  );
  const root = document.getElementById("root") as HTMLElement;
  render(appDOM, root);
  buildMenu(windowType, recentFiles);
}

init();
