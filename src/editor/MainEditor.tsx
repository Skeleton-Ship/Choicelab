// Libraries
import { ask } from "@tauri-apps/api/dialog";
import { getVersion } from "@tauri-apps/api/app";
import { listen, emit } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import { resolve } from "@tauri-apps/api/path";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "preact/hooks";
// App functions
import { Sequence } from "../typings";
import { getStore, setStore } from "../data/dataStore";
import { getCurrentSequence } from "../data/getData";
import { handleUndoRedo, canUndo, canRedo } from "../data/history";
import { saveHistoryVersion } from "../data/history";
import { handleCutCopy, handlePaste } from "./sequence/general/handleCopyPaste";
import { getFocusedRegion } from "../utils/focusedRegion";
// App elements
import Toolbar from "./toolbar/Toolbar";
import SequenceEl from "./sequence/Sequence";
import NodePane from "./NodePane";

export default function MainEditor() {
  useEffect(() => {
    // Set the title based on the project name
    appWindow.setTitle(store.project.name);
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
        contents: JSON.stringify(newStore.project, null, 2),
        projectPath: await resolve(newStore.projectPath),
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
    window.addEventListener("focus", () => {
      const store = getStore();
      store.focus = true;
      document.querySelector("#App")?.setAttribute("data-focus", "true");
      setStore(store);
    });
    window.addEventListener("blur", () => {
      const store = getStore();
      store.focus = false;
      document.querySelector("#App")?.setAttribute("data-focus", "false");
      setStore(store);
    });
    appWindow.listen("tauri://close-requested", async () => {
      const store = getStore();
      if (store.saved) {
        appWindow.close();
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
        appWindow.close();
      }
    });
  }, []);

  const store = getStore();

  // @ts-ignore
  const [refresh, triggerRefresh] = useState(uuidv4());
  const handleUpdate = async (updateHistory: boolean = true) => {
    // Update history
    if (updateHistory === true) {
      saveHistoryVersion();
    }
    // Check if we can undo
    let undoState = canUndo() === true ? "enable" : "disable";
    emit("enable-menu-item", {
      item: "undo",
      state: undoState,
    });
    // Check if we can redo
    let redoState = canRedo() === true ? "enable" : "disable";
    emit("enable-menu-item", {
      item: "redo",
      state: redoState,
    });
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
        <NodePane update={handleUpdate} />
      </div>
    </div>
  );
}
