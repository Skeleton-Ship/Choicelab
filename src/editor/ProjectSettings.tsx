import { useState, useEffect } from "preact/hooks";
import { v4 as uuidv4 } from "uuid";
import { emit, emitTo, listen } from "@tauri-apps/api/event";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { getStore, setStore } from "../data/dataStore";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { projectSettingsPanes } from "../data/settingsDefs";
import { SettingsPane } from "./settings/SettingsPane";
import { GearIcon } from "./shared/ColorIcon";
import { PaintbrushIcon } from "./shared/ColorIcon";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { setMenu } from "../menu/setMenu";
import {
  handleSettingsUndoRedo,
  SETTINGS_SYNC_EVENT,
} from "./settings/settingsUndo";
const appWindow = getCurrentWebviewWindow();

type PaneId = "general" | "appearance";

async function setWindowSize(paneId: PaneId) {
  const heights: { general: number; appearance: number } = {
    general: 210,
    appearance: 600,
  };
  const currentSize = await appWindow.size();
  const scaleFactor = await appWindow.scaleFactor();
  const width = currentSize.width / scaleFactor;
  appWindow.setSize(new LogicalSize(width, heights[paneId]));
}

export function ProjectSettings(props: { startingPane: PaneId }) {
  const store = getStore();
  useEffect(() => {
    appWindow.setTitle(`${store.project.name} — Project Settings`);
    appWindow.show();
    // Let Tauri know the window is ready
    emit("window-ready", {
      label: getProjectWindowLabel(store.projectPath, "settings"),
    });
    const unlistenStore = listen<string>("editor-store-updated", (event) => {
      setStore(JSON.parse(event.payload));
      handleUpdate();
      setMenu("projectSettings");
    });
    // This window opens with only the project, so ask for the rest (e.g.
    // history, for undo) once it can be received
    unlistenStore.then(() =>
      emitTo(getProjectWindowLabel(store.projectPath), SETTINGS_SYNC_EVENT, {
        projectId: store.project.id,
      })
    );
    // Undo and redo. Menu events reach every window, labeled with the
    // focused one.
    const unlistenUndo = appWindow.listen<{ label: string }>(
      "menu-undo",
      (event) => {
        if (event.payload.label !== appWindow.label) return;
        handleSettingsUndoRedo("undo");
      }
    );
    const unlistenRedo = appWindow.listen<{ label: string }>(
      "menu-redo",
      (event) => {
        if (event.payload.label !== appWindow.label) return;
        handleSettingsUndoRedo("redo");
      }
    );
    // Undo and redo are available in text fields, so update the menu as
    // focus moves
    const updateMenu = () => setMenu("projectSettings");
    window.addEventListener("focusin", updateMenu);
    window.addEventListener("focusout", updateMenu);
    return () => {
      unlistenStore.then((fn) => fn());
      unlistenUndo.then((fn) => fn());
      unlistenRedo.then((fn) => fn());
      window.removeEventListener("focusin", updateMenu);
      window.removeEventListener("focusout", updateMenu);
    };
  }, []);

  const [paneId, setPaneId] = useState<PaneId>(props.startingPane);
  const panes = projectSettingsPanes;
  const [_refresh, triggerRefresh] = useState(uuidv4());
  const handleUpdate = async () => {
    triggerRefresh(uuidv4());
  };
  useEffect(() => {
    setWindowSize(paneId);
  }, [paneId]);
  return (
    <section id="project-settings" aria-label="Tabbed Interface">
      <div class="ui-toolbar" data-tauri-drag-region>
        <div
          role="tablist"
          class="toolbar-region"
          aria-label="Tabs"
          data-tauri-drag-region
        >
          {panes.map((pane) => {
            const id = pane.id as PaneId;
            return (
              <button
                role="tab"
                aria-selected={paneId === id ? "true" : "false"}
                aria-controls={`pane-${id}`}
                id={`tab-${id}`}
                onClick={() => {
                  setPaneId(id);
                }}
              >
                {pane.id === "general" ? (
                  <GearIcon size={50} />
                ) : pane.id === "appearance" ? (
                  <PaintbrushIcon size={50} />
                ) : null}
                <span>{pane.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {panes.map((pane) => {
        return (
          <div
            role="tabpanel"
            class="settings-pane"
            id={`pane-${pane.id}`}
            aria-labelledby={`tab-${pane.id}`}
            hidden={paneId === pane.id ? false : true}
          >
            {pane.id === paneId ? (
              <SettingsPane id={pane.id} />
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
