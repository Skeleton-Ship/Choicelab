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
import { handleCloseRequest, handleQuit } from "../fs/handleCloseRequest";
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
import { triggerApply } from "../data/autoGenerate";
import { openProjectSettings } from "./settings/openProjectSettings";
const appWindow = getCurrentWebviewWindow();

export default function MainEditor() {
  useEffect(() => {
    const label = getProjectWindowLabel(store.projectPath);
    updatePreview(true);
    // Get preview server — await registration before emitting window-ready to
    // avoid a race where the backend responds with preview-port before the
    // listener is active.
    const unlistenPreviewPort = listen("preview-port", (event: any) => {
      if (event && event.payload && event.payload.port) {
        const viewStore = getViewStore();
        if (event.payload.label !== label) return;
        viewStore.previewPort = event.payload.port;
        setViewStore(viewStore);
      }
    }).then((unlisten) => {
      appWindow.setTitle(store.project.name);
      emit("window-ready", { label });
      return unlisten;
    });
    // Set up cut/copy/paste listeners
    const cutHandler = (e: Event) => {
      if (getFocusedRegion() === "sequence") {
        e.preventDefault();
        handleCutCopy("cut", handleUpdate);
      }
    };
    const copyHandler = (e: Event) => {
      if (getFocusedRegion() === "sequence") {
        e.preventDefault();
        handleCutCopy("copy", handleUpdate);
      }
    };
    const pasteHandler = (e: Event) => {
      if (getFocusedRegion() === "sequence") {
        e.preventDefault();
        handlePaste(handleUpdate);
      }
    };
    window.addEventListener("cut", cutHandler);
    window.addEventListener("copy", copyHandler);
    window.addEventListener("paste", pasteHandler);
    const unlistenRequestProject = listen(
      "request-project-from-parent",
      async (event) => {
        const payload = event.payload as { label: string };
        const label = payload.label as string;
        const data = stringify(getStore().project);
        emitTo(label, "receive-project-from-parent", { data: data });
      }
    );
    const unlistenSettingsStore = listen(
      "settings-store-updated",
      async (event) => {
        const payload = event.payload as string;
        const newStore = JSON.parse(payload);
        if (newStore.project.id !== store.project.id) return;
        setStore(newStore);
        handleUpdate(true, true);
      }
    );
    // Close listeners
    const unlistenCloseRequested = appWindow.listen(
      "tauri://close-requested",
      async () => {
        handleCloseRequest();
      }
    );
    // Menu events - Rust now emits only to the focused window,
    // so we use appWindow.listen() to receive window-specific events
    const unlistenMenuQuit = appWindow.listen<{ label: string }>("menu-request-quit", (event) => {
      if (event.payload.label !== appWindow.label) return;
      handleQuit();
    });
    const unlistenMenuSave = appWindow.listen<{ label: string }>("menu-save-project", (event) => {
      if (event.payload.label !== appWindow.label) return;
      console.log("Request to save");
      saveProject();
    });
    const unlistenMenuTogglePreview = appWindow.listen<{ label: string }>(
      "menu-toggle-preview",
      (event) => {
        if (event.payload.label !== appWindow.label) return;
        togglePreview(handleUpdate);
      }
    );
    const unlistenMenuOpenPreview = appWindow.listen<{ label: string }>(
      "menu-open-preview",
      async (event) => {
        if (event.payload.label !== appWindow.label) return;
        const port = getViewStore().previewPort;
        await open(`http://localhost:${port}`);
      }
    );
    const unlistenMenuUndo = appWindow.listen<{ label: string }>("menu-undo", (event) => {
      if (event.payload.label !== appWindow.label) return;
      handleUndoRedo("undo", handleUpdate);
    });
    const unlistenMenuRedo = appWindow.listen<{ label: string }>("menu-redo", (event) => {
      if (event.payload.label !== appWindow.label) return;
      handleUndoRedo("redo", handleUpdate);
    });
    const unlistenMenuNewCell = appWindow.listen<{ label: string }>("menu-new-cell", (event) => {
      if (event.payload.label !== appWindow.label) return;
      const newCell = createCell();
      insertNewNode(newCell, handleUpdate);
    });
    const unlistenMenuNewBranch = appWindow.listen<{ label: string }>(
      "menu-new-branch",
      (event) => {
        if (event.payload.label !== appWindow.label) return;
        const newBranch = createBranch();
        insertNewNode(newBranch, handleUpdate);
      }
    );
    const unlistenMenuSetLink = appWindow.listen<{ label: string }>("menu-set-link", (event) => {
      if (event.payload.label !== appWindow.label) return;
      enterTargetMode({
        update: handleUpdate,
      });
    });
    const unlistenMenuDisconnectLink = appWindow.listen<{ label: string }>(
      "menu-disconnect-link",
      (event) => {
        if (event.payload.label !== appWindow.label) return;
        handleDisconnectLinks(handleUpdate);
      }
    );
    const unlistenMenuDeleteNodes = appWindow.listen<{ label: string }>(
      "menu-delete-nodes",
      (event) => {
        if (event.payload.label !== appWindow.label) return;
        handleDeleteNodes(handleUpdate);
      }
    );
    const unlistenMenuDeleteStem = appWindow.listen<{ label: string }>(
      "menu-delete-stem",
      (event) => {
        if (event.payload.label !== appWindow.label) return;
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
      }
    );
    const unlistenMenuProjectSettings = appWindow.listen<{ label: string }>(
      "menu-open-project-settings",
      (event) => {
        if (event.payload.label !== appWindow.label) return;
        openProjectSettings();
      }
    );
    const unlistenMenuAutofill = appWindow.listen<{ label: string }>("menu-autofill", (event) => {
      if (event.payload.label !== appWindow.label) return;
      triggerApply();
    });
    appWindow.show();
    // Once ready, check for updates
    checkForUpdates();
    return () => {
      window.removeEventListener("cut", cutHandler);
      window.removeEventListener("copy", copyHandler);
      window.removeEventListener("paste", pasteHandler);
      unlistenPreviewPort.then((fn) => fn());
      unlistenRequestProject.then((fn) => fn());
      unlistenSettingsStore.then((fn) => fn());
      unlistenCloseRequested.then((fn) => fn());
      unlistenMenuQuit.then((fn) => fn());
      unlistenMenuSave.then((fn) => fn());
      unlistenMenuTogglePreview.then((fn) => fn());
      unlistenMenuOpenPreview.then((fn) => fn());
      unlistenMenuUndo.then((fn) => fn());
      unlistenMenuRedo.then((fn) => fn());
      unlistenMenuNewCell.then((fn) => fn());
      unlistenMenuNewBranch.then((fn) => fn());
      unlistenMenuSetLink.then((fn) => fn());
      unlistenMenuDisconnectLink.then((fn) => fn());
      unlistenMenuDeleteNodes.then((fn) => fn());
      unlistenMenuDeleteStem.then((fn) => fn());
      unlistenMenuProjectSettings.then((fn) => fn());
      unlistenMenuAutofill.then((fn) => fn());
    };
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
