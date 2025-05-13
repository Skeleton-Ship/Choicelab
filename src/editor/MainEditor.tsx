// Libraries
import { ask } from "@tauri-apps/api/dialog";
import { appCacheDir } from "@tauri-apps/api/path";
import { getVersion } from "@tauri-apps/api/app";
import { listen, emit } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import { resolve } from "@tauri-apps/api/path";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "preact/hooks";
// App functions
import { stringify } from "../utils/stringify";
import { Sequence } from "../typings";
import { getStore, setStore } from "../data/dataStore";
import { getCurrentSequence } from "../data/getData";
import { handleUndoRedo, canUndo, canRedo } from "../data/history";
import { saveHistoryVersion } from "../data/history";
import {
  handleCutCopy,
  handlePaste,
} from "./flowchart/general/handleCopyPaste";
import { getFocusedRegion } from "../utils/focusedRegion";
import showPane from "./inspector/functions/showPane";
// App elements
import Toolbar from "./toolbar/Toolbar";
import SequenceEl from "./Flowchart";
import Inspector from "./Inspector";
import TargetMode from "./flowchart/target-mode/TargetMode";

export default function MainEditor() {
  useEffect(() => {
    // Set the title based on the project name
    appWindow.setTitle(store.project.name);
    // Set up actions/variables view listeners
    listen("menu-show-node-editor", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      showPane("node-editor", handleUpdate);
    });
    listen("menu-show-variables", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      showPane("variables", handleUpdate);
    });
    // Set up undo/redo listeners
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
    // Set up save listener
    listen("menu-save-project", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const newStore = getStore();
      // Update app version
      const appVersion = await getVersion();
      newStore.project.appVersion = appVersion;
      // Pass to back-end
      emit("save-text-file", {
        name: "project.json",
        contents: stringify(newStore.project),
        path: await resolve(newStore.projectPath),
      });
      newStore.saved = true;
      appWindow.setTitle(store.project.name);
      setStore(newStore);
      handleUpdate(false);
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
    // Enable cell + branch menu items
    appWindow.emit("enable-menu-items", {
      enableItems: ["new_cell", "new_branch"],
    });
    // Focus listeners
    listen("tauri://focus", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      const store = getStore();
      store.focus = true;
      document.querySelector("#App")?.setAttribute("data-focus", "true");
      setStore(store);
      // Re-enable cell + branch menu items, in case we focused away
      appWindow.emit("enable-menu-items", {
        enableItems: ["new_cell", "new_branch"],
      });
    });
    listen("tauri://blur", async () => {
      const store = getStore();
      store.focus = false;
      document.querySelector("#App")?.setAttribute("data-focus", "false");
      setStore(store);
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
      appWindow.close();
    }
    async function handleCloseRequest() {
      const store = getStore();
      if (store.saved) {
        handleClose();
        return;
      }
      const confirm = await ask(
        "Do you want to save your changes before quitting?",
        {
          title: "Quit before saving?",
          type: "warning",
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
  const handleUpdate = async (updateHistory: boolean = true) => {
    // Update history
    if (updateHistory === true) {
      saveHistoryVersion();
    }
    // Check if we can undo
    let undoState =
      canUndo() === true
        ? { enableItems: ["undo"] }
        : { disableItems: ["undo"] };
    emit("enable-menu-items", undoState);
    // Check if we can redo
    let redoState =
      canRedo() === true ? { enableItems: ["redo"] } : { redo: ["undo"] };
    emit("enable-menu-items", redoState);
    // Trigger refresh
    triggerRefresh(uuidv4());
  };

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
