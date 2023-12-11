import { ask } from "@tauri-apps/api/dialog";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "preact/hooks";
import { Sequence } from "../typings";
import { getStore, setStore } from "../data/dataStore";
import { getCurrentSequence } from "../data/getData";
import Toolbar from "./toolbar/Toolbar";
import { listen, emit } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import { resolve } from "@tauri-apps/api/path";
import { handleUndoRedo, canUndo, canRedo } from "../data/history";
import { saveHistoryVersion } from "../data/history";
import SequenceEl from "./sequence/Sequence";

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
      emit("save-text-file", {
        name: "project.json",
        contents: JSON.stringify(newStore.project),
        projectPath: await resolve(newStore.projectPath),
      });
      newStore.saved = true;
      appWindow.setTitle(store.project.name);
      setStore(newStore);
      handleUpdate(false);
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
          okLabel: "Quit without saving",
          cancelLabel: "Go back",
        }
      );
      if (confirm === true) {
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
      {flowchartContents}
    </div>
  );
}
