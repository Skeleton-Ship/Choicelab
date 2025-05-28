// Libraries
import { ask } from "@tauri-apps/plugin-dialog";
import { appCacheDir } from "@tauri-apps/api/path";
import { listen, emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { resolve } from "@tauri-apps/api/path";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "preact/hooks";
// App functions
import { Sequence } from "../typings";
import { getStore, getViewStore, setViewStore } from "../data/dataStore";
import { getCurrentSequence } from "../data/getData";
import { saveHistoryVersion } from "../data/history";
import {
  handleCutCopy,
  handlePaste,
} from "./flowchart/general/handleCopyPaste";
import { getFocusedRegion } from "../utils/focusedRegion";
import {
  updatePreview as handleUpdatePreview,
  updatePreview,
} from "../preview/updatePreview";
import { setMenu } from "../menu/setMenu";
// App elements
import Toolbar from "./toolbar/Toolbar";
import SequenceEl from "./Flowchart";
import Inspector from "./Inspector";
import TargetMode from "./flowchart/target-mode/TargetMode";
const appWindow = getCurrentWebviewWindow();

export default function MainEditor() {
  useEffect(() => {
    setMenu();
    updatePreview(true);
    // Set the title based on the project name
    appWindow.setTitle(store.project.name);
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
    // Focus listeners
    listen("tauri://focus", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const store = getViewStore();
      store.focus = true;
      document.querySelector("#App")?.setAttribute("data-focus", "true");
      setMenu();
      setViewStore(store);
    });
    listen("tauri://blur", async () => {
      const store = getViewStore();
      store.focus = false;
      document.querySelector("#App")?.setAttribute("data-focus", "false");
      setViewStore(store);
    });
    // Close listeners
    async function handleClose() {
      // Clear cache
      const cacheBase = await appCacheDir();
      const cachePath = await resolve(cacheBase, "Projects");
      emit("clear-cache", {
        path: cachePath,
      });
      // Close it, baby!
      appWindow.destroy();
    }
    async function handleCloseRequest() {
      const store = getViewStore();
      if (store.saved) {
        handleClose();
        return;
      }
      const confirm = await ask(
        "Do you want to save your changes before quitting?",
        {
          title: "Quit before saving?",
          kind: "warning",
          okLabel: "Go Back",
          cancelLabel: "Quit Without Saving",
        }
      );
      if (confirm === false) {
        handleClose();
      }
    }
    appWindow.listen("tauri://close-requested", async () => {
      handleCloseRequest();
    });
    listen("menu-request-quit", () => {
      handleCloseRequest();
    });
  }, []);

  const store = getStore();

  const [_refresh, triggerRefresh] = useState(uuidv4());
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
    // Update menu
    setMenu();
    // Trigger refresh
    triggerRefresh(uuidv4());
  };

  window.__CHOICELAB_FUNCTIONS__.updateProject = handleUpdate;

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
