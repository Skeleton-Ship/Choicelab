import { useState, useEffect } from "preact/hooks";
import { v4 as uuidv4 } from "uuid";
import { emit } from "@tauri-apps/api/event";
import { listen } from "@tauri-apps/api/event";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { getStore, setStore } from "../data/dataStore";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getPlayerConfig } from "../player/getPlayerConfig";
import { SettingsPane } from "./settings/SettingsPane";
import { IconGeneral } from "./settings/IconGeneral";
import { IconAppearance } from "./settings/IconAppearance";
import { setMenu } from "../menu/setMenu";
import { LogicalSize } from "@tauri-apps/api/dpi";
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
    appWindow.setDecorations(false);
    appWindow.show();
    // Let Tauri know the window is ready
    emit("window-ready", {
      label: getProjectWindowLabel(store.projectPath, "settings"),
    });
    setMenu("projectSettings");
    // Focus listeners
    listen("tauri://focus", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      setMenu("projectSettings");
    });
    listen("editor-store-updated", async (event) => {
      const payload = event.payload as string;
      const newStore = JSON.parse(payload);
      setStore(newStore);
      handleUpdate();
    });
  }, []);

  const [paneId, setPaneId] = useState<PaneId>(props.startingPane);
  const config = getPlayerConfig();
  const panes = config.projectSettings.panes;
  const [_refresh, triggerRefresh] = useState(uuidv4());
  const handleUpdate = async () => {
    triggerRefresh(uuidv4());
  };
  useEffect(() => {
    setWindowSize(paneId);
  }, [paneId]);
  return (
    <section id="project-settings" aria-label="Tabbed Interface">
      <div class="ui-toolbar">
        <div
          class="tabs"
          role="tablist"
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
                  <IconGeneral />
                ) : pane.id === "appearance" ? (
                  <IconAppearance />
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
              <SettingsPane id={pane.id} config={config} />
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
