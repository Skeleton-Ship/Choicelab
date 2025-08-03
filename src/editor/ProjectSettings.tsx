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
const appWindow = getCurrentWebviewWindow();

export function ProjectSettings(props: { startingPane: string }) {
  const store = getStore();
  useEffect(() => {
    appWindow.setTitle(`${store.project.name} - Project Settings`);
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
  const [paneId, setPaneId] = useState(props.startingPane);
  const config = getPlayerConfig();
  const panes = config.projectSettings.panes;
  const [_refresh, triggerRefresh] = useState(uuidv4());
  const handleUpdate = async () => {
    triggerRefresh(uuidv4());
  };
  return (
    <section aria-label="Tabbed Interface">
      <div class="ui-toolbar">
        <div
          class="tabs"
          role="tablist"
          aria-label="Tabs"
          data-tauri-drag-region
        >
          {panes.map((pane) => {
            return (
              <button
                role="tab"
                aria-selected={paneId === pane.id ? "true" : "false"}
                aria-controls={`pane-${pane.id}`}
                id={`tab-${pane.id}`}
                onClick={() => {
                  setPaneId(pane.id);
                }}
              >
                {pane.id === "general" ? (
                  <IconGeneral />
                ) : pane.id === "appearance" ? (
                  <IconAppearance />
                ) : null}
                {pane.label}
              </button>
            );
          })}
        </div>
      </div>
      {panes.map((pane) => {
        return (
          <div
            role="tabpanel"
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
