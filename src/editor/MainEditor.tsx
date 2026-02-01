// Libraries
import { listen, emit, emitTo } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-shell";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "preact/hooks";
// App functions
import { Branch, Sequence } from "../typings";
import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../data/dataStore";
import { getCurrentSequence, getStemParent } from "../data/getData";
import { handleUndoRedo, saveHistoryVersion } from "../data/history";
import { handleCloseRequest } from "../fs/handleCloseRequest";
import {
  handleCutCopy,
  handlePaste,
} from "./flowchart/general/handleCopyPaste";
import { getFocusedRegion } from "../utils/focusedRegion";
import { togglePreview } from "../preview/togglePreview";
import {
  updatePreview as handleUpdatePreview,
  updatePreview,
} from "../preview/updatePreview";
import { setMenu } from "../menu/setMenu";
import { checkForUpdates } from "../utils/checkForUpdates";
// App elements
import Toolbar from "./toolbar/Toolbar";
import SequenceEl from "./Flowchart";
import Inspector from "./Inspector";
import TargetMode from "./flowchart/target-mode/TargetMode";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { stringify } from "../utils/stringify";
import { saveProject } from "../fs/saveProject";
import { createBranch, createCell } from "../data/createNode";
import insertNewNode from "./flowchart/general/insertNewNode";
import enterTargetMode from "./flowchart/target-mode/enterTargetMode";
import handleDisconnectLinks from "./flowchart/general/handleDisconnectLinks";
import {
  handleDeleteNodes,
  handleDeleteStem,
} from "./flowchart/general/handleDelete";
import { openProjectSettings } from "./settings/openProjectSettings";
const appWindow = getCurrentWebviewWindow();

export default function MainEditor() {
  /*
   * TODO: Return and unmount listeners
   */
  useEffect(() => {
    const label = getProjectWindowLabel(store.projectPath);
    updatePreview(true);
    // Get preview server
    listen("preview-port", (event: any) => {
      if (event && event.payload && event.payload.port) {
        const viewStore = getViewStore();
        if (event.payload.label !== label) return;
        viewStore.previewPort = event.payload.port;
        setViewStore(viewStore);
      }
    });
    // Set the title based on the project name
    appWindow.setTitle(store.project.name);
    // Let Tauri know the window is ready
    emit("window-ready", {
      label: label,
    });
    // Set up cut/copy listener
    window.addEventListener("cut", (e) => {
      if (getFocusedRegion() === "sequence") {
        e.preventDefault();
        handleCutCopy("cut", handleUpdate);
      }
    });
    window.addEventListener("copy", (e) => {
      if (getFocusedRegion() === "sequence") {
        e.preventDefault();
        handleCutCopy("copy", handleUpdate);
      }
    });
    window.addEventListener("paste", (e) => {
      if (getFocusedRegion() === "sequence") {
        e.preventDefault();
        handlePaste(handleUpdate);
      }
    });
    listen("request-project-from-parent", async (event) => {
      const payload = event.payload as { label: string };
      const label = payload.label as string;
      const data = stringify(getStore().project);
      emitTo(label, "receive-project-from-parent", { data: data });
    });
    listen("settings-store-updated", async (event) => {
      const payload = event.payload as string;
      const newStore = JSON.parse(payload);
      if (newStore.project.id !== store.project.id) return;
      setStore(newStore);
      handleUpdate(true, true);
    });
    // Close listeners
    appWindow.listen("tauri://close-requested", async () => {
      handleCloseRequest();
    });
    // Menu events
    listen("menu-request-quit", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleCloseRequest();
    });
    listen("menu-save-project", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      saveProject();
    });
    listen("menu-toggle-preview", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      togglePreview(handleUpdate);
    });
    listen("menu-open-preview", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const port = getViewStore().previewPort;
      await open(`http://localhost:${port}`);
    });
    listen("menu-undo", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleUndoRedo("undo", handleUpdate);
    });
    listen("menu-redo", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleUndoRedo("redo", handleUpdate);
    });
    listen("menu-new-cell", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const newCell = createCell();
      insertNewNode(newCell, handleUpdate);
    });
    listen("menu-new-branch", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const newBranch = createBranch();
      insertNewNode(newBranch, handleUpdate);
    });
    listen("menu-set-link", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      enterTargetMode({
        update: handleUpdate,
      });
    });
    listen("menu-disconnect-link", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleDisconnectLinks(handleUpdate);
    });
    listen("menu-delete-nodes", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      handleDeleteNodes(handleUpdate);
    });
    listen("menu-delete-stem", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const store = getStore();
      const selectedStem = getViewStore().selectedStem;
      if (selectedStem !== false) {
        const parentBranch: Branch | undefined = getStemParent(
          selectedStem.id,
          store
        );
        if (parentBranch && selectedStem.type !== "noMatch") {
          handleDeleteStem(selectedStem.id, parentBranch.id, handleUpdate);
        }
      }
    });
    listen("menu-open-project-settings", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      openProjectSettings();
    });
    appWindow.show();
    // Once ready, check for updates
    checkForUpdates();
  }, []);

  const store = getStore();

  const [_refresh, triggerRefresh] = useState(uuidv4());
  const [_viewRefresh, triggerViewRefresh] = useState(uuidv4());
  const handleUpdateView = async () => {
    setMenu();
    // Update preview
    handleUpdatePreview(false);
    triggerViewRefresh(uuidv4());
  };
  const handleUpdate = async (
    updateHistory: boolean = true,
    updatePreview?: boolean
  ) => {
    // Update history
    if (updateHistory === true) {
      saveHistoryVersion();
    }
    // Update preview
    if (typeof updatePreview === "undefined" || updatePreview === true) {
      handleUpdatePreview(false);
    }
    // Trigger refresh
    triggerRefresh(uuidv4());
    // Update menu
    setMenu();
  };

  window.__CHOICELAB_FUNCTIONS__.updateProject = handleUpdate;
  window.__CHOICELAB_FUNCTIONS__.updateView = handleUpdateView;

  // Load sequence
  const sequence: Sequence | undefined = getCurrentSequence(store);
  let flowchartContents = <div>No sequence selected</div>;
  if (sequence) {
    const sequenceId = sequence.id;
    flowchartContents = <SequenceEl id={sequenceId} update={handleUpdate} />;
  }

  return (
    <div id="editor">
      <Toolbar update={handleUpdate} />
      <div id="editor-contents">
        {flowchartContents}
        <Inspector update={handleUpdate} />
        <TargetMode update={handleUpdate} />
      </div>
    </div>
  );
}
