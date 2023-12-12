import { render } from "preact";
import Launcher from "./launcher/Launcher";
import { appWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import newProject from "./fs/newProject";
import openProject from "./fs/openProject";
import loadProjectData from "./fs/loadProjectData";
import MainEditor from "./editor/MainEditor";
import { getStore, setStore, createDataStore } from "./data/dataStore";
import { saveHistoryVersion } from "./data/history";
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
    if (projectPath === "") return;
    const projectData = await loadProjectData(projectPath);
    if (typeof projectData === "undefined") return false;
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
  /*[
	onEventFromMain("focus", "", () => {
	  updateFocus(true);
	});
	onEventFromMain("blur", "", () => {
	  updateFocus(false);
	});
	*/

  const appDOM = (
    <div id="App" data-target-mode="">
      {elements}
    </div>
  );
  const root = document.getElementById("root") as HTMLElement;
  render(appDOM, root);
}

init();
