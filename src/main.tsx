import { render } from "preact";
import Launcher from "./launcher/Launcher";
import { appWindow } from "@tauri-apps/api/window";
import { listen, emit } from "@tauri-apps/api/event";
import { message } from "@tauri-apps/api/dialog";
import IndexedDB from "./editor/inspector/functions/indexedDB";
import newProject from "./fs/newProject";
import openProject from "./fs/openProject";
import loadProjectData from "./fs/loadProjectData";
import MainEditor from "./editor/MainEditor";
import { getStore, setStore, createDataStore } from "./data/dataStore";
import { saveHistoryVersion } from "./data/history";
import { setFocusedRegion } from "./utils/focusedRegion";
import "./styles/style.scss";

async function init() {
  // New + open project listeners
  listen("menu-new-project", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    newProject();
  });
  listen("menu-open-project", async () => {
    const focused = await appWindow.isFocused();
    if (focused === false) return;
    openProject();
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
  // create asset manager
  window.__CHOICELAB_ASSET_CACHE__ = new IndexedDB(
    "Choicelab_AssetCache",
    "Assets"
  );

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
    const projectData = await loadProjectData(projectPath);
    if (!projectData) {
      message(
        "Make sure the selected folder is a Choicelab project folder, then try again.",
        "The selected folder couldn't be opened."
      );
      appWindow.close();
      return;
    }
    appWindow.show();
    // Let Rust know that the project was opened
    emit("project-opened");
    // Create data store
    createDataStore(projectData, projectPath);
    // Load store
    const store = getStore();
    // Load the default sequence
    store.currentSequenceId = store.project.sequences[0].id;
    setStore(store);
    // Save initial history version
    saveHistoryVersion(true);
    // Create editor
    elements = <MainEditor />;
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
