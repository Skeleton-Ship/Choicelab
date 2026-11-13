import { render } from "preact";
import Launcher from "./launcher/Launcher";
import { WhatsNew } from "./whats-new/WhatsNew";
import { Acknowledgments } from "./acknowledgments/Acknowledgments";
import { License } from "./license/License";
import { About } from "./about/About";
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
import { initHistory } from "./data/history";
import { getFocusedRegion, setFocusedRegion } from "./utils/focusedRegion";
import { stringify } from "./utils/stringify";
import { Project, LoadError, WindowType } from "./typings";
import "./styles/_style.scss";
import { getProjectWindowLabel } from "./utils/getProjectWindowLabel";
import { createWebDir } from "./fs/createWebDir";
import { setAccentColor } from "./utils/setAccentColor";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import loadProject from "./fs/loadProject";
import markUnsaved from "./data/markUnsaved";
import {
  needsMigration,
  migrateProject,
  isFromNewerVersion,
  upgradeProjectRichText,
} from "./fs/migrateProject";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { open } from "@tauri-apps/plugin-shell";
import { setMenu } from "./menu/setMenu";
import openProject from "./fs/openProject";
import { buildMenu } from "./menu/buildMenu";
import { installMenuShortcuts } from "./menu/menuShortcuts";
import { exportProject, getExportDirName } from "./fs/exportProject";
import { desktopDir, resolve } from "@tauri-apps/api/path";
import { getDialogText } from "./utils/dialogText";
import { ErrorBoundary } from "./errors/ErrorBoundary";
import { installGlobalErrorHandlers } from "./errors/globalErrorHandlers";
import { handleStartupError } from "./errors/startupError";
import { checkForUpdatesFromMenu } from "./utils/checkForUpdates";
const platform = getPlatform();
const appWindow = getCurrentWebviewWindow();

// macOS: set when this window skipped a menu rebuild while in the background
let menuNeedsRebuild = false;
const getRecentFiles = () =>
  invoke<string[]>("get_recent_files").catch(() => [] as string[]);

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
  const windowType: WindowType = urlParams.get("window_type") as WindowType;
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
  await reportFocusedWindow();
  appWindow.listen("tauri://focus", async () => {
    document.querySelector("#App")?.setAttribute("data-focus", "true");
    // Update view store
    const viewStore = getViewStore();
    if (viewStore) {
      viewStore.focus = true;
      setViewStore(viewStore);
    }
    // Report focus before updating the menu: on macOS, menu state from
    // windows other than the focused one is ignored
    await reportFocusedWindow();
    // Update menu
    if (menuNeedsRebuild) {
      menuNeedsRebuild = false;
      buildMenu(windowType, await getRecentFiles());
    } else {
      setMenu(windowType);
    }
  });
  appWindow.listen("tauri://blur", async () => {
    document.querySelector("#App")?.setAttribute("data-focus", "false");
    const viewStore = getViewStore();
    if (viewStore) {
      viewStore.focus = false;
      setViewStore(viewStore);
    }
  });
  // Undo, redo, and delete depend on whether a text field is focused, so
  // update the menu as focus moves (once, after focus settles)
  if (windowType === "project" || windowType === "projectSettings") {
    let menuUpdateScheduled = false;
    const scheduleMenuUpdate = () => {
      if (menuUpdateScheduled) return;
      menuUpdateScheduled = true;
      setTimeout(() => {
        menuUpdateScheduled = false;
        setMenu(windowType);
      }, 0);
    };
    window.addEventListener("focusin", scheduleMenuUpdate);
    window.addEventListener("focusout", scheduleMenuUpdate);
  }
  // Region focus listeners. Some menu items depend on the region (e.g.
  // "Delete Action" vs. "Delete Node"), so update the menu when it changes.
  const updateFocusedRegion = (targetEl: Element) => {
    const previousRegion = getFocusedRegion();
    setFocusedRegion(targetEl);
    if (windowType === "project" && getFocusedRegion() !== previousRegion) {
      setMenu(windowType);
    }
  };
  window.addEventListener("pointerdown", (e) => {
    updateFocusedRegion(e.target as HTMLElement);
  });
  // Clicking a non-focusable area (e.g. an action's background) leaves focus
  // on the body, which is in no region; keep the clicked region in that case,
  // or a shortcut's keyup (e.g. Cmd+C) would clear it before the next one
  window.addEventListener("keyup", () => {
    const activeEl = document.activeElement;
    if (activeEl !== null && activeEl !== document.body) {
      updateFocusedRegion(activeEl);
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
        // The original target: e.target is only the shadow host for fields
        // in a shadow root (e.g. the Custom CSS editor)
        const target = (e.composedPath()[0] ?? e.target) as Element;
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
  appWindow.listen<{ label: string }>("menu-check-for-updates", (event) => {
    if (event.payload.label !== appWindow.label) return;
    checkForUpdatesFromMenu(windowType);
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
  if (windowType === "about") {
    elements = <About />;
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
    // Refuse projects saved by a newer version, which this one can't read correctly
    if (windowType === "project" && isFromNewerVersion(projectData)) {
      const dialog = getDialogText(
        "Newer version required",
        "This project was saved with a newer version of Choicelab.",
        "To open it, update Choicelab to the latest version."
      );
      await message(dialog.message, { title: dialog.title, kind: "warning" });
      appWindow.close();
      return;
    }
    // Migrate projects saved with an older schema version
    // (the settings window receives already-migrated data from the project window)
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
      try {
        await invoke("save_project_file", {
          directory: projectPath,
          fileName,
          contents: stringify(projectData as Project),
        });
      } catch (error) {
        // The updated project is still open, and saving it will report the
        // problem then; no need to stop here
        console.error("Couldn't save the updated project:", error);
      }
    }
    // Projects saved by development builds of schema 3 may predate rich text
    upgradeProjectRichText(projectData as Project);
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
      // Start undo history
      initHistory();
      if (loadedFromAutosave) {
        markUnsaved();
      }
      // Create editor
      elements = <MainEditor />;
      // Create web folder
      createWebDir(store.projectPath, label);
    } else if (windowType === "projectSettings") {
      const pane = urlParams.get("pane") as "general" | "appearance";
      elements = <ProjectSettings startingPane={pane} />;
    }
  }

  // Build menu with current recent files; rebuild whenever the list changes.
  const recentFiles = await getRecentFiles();

  listen("rebuild-open-recent-menu", async () => {
    // macOS has one app-wide menu, which reflects the focused window. Other
    // windows rebuild when they next gain focus.
    if (platform === "macos" && !(await appWindow.isFocused())) {
      menuNeedsRebuild = true;
      return;
    }
    buildMenu(windowType, await getRecentFiles());
  });

  const appDOM = (
    <div id="App" data-platform={platform} data-focused-region="">
      <ErrorBoundary windowType={windowType}>{elements}</ErrorBoundary>
    </div>
  );
  const root = document.getElementById("root") as HTMLElement;
  render(appDOM, root);
  installMenuShortcuts();
  buildMenu(windowType, recentFiles);
}

installGlobalErrorHandlers();
init().catch(handleStartupError);
