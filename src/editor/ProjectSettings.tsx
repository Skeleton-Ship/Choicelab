import { useState, useEffect } from "preact/hooks";
import { emit } from "@tauri-apps/api/event";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { getStore } from "../data/dataStore";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getPlayerConfig } from "../player/getPlayerConfig";
const appWindow = getCurrentWebviewWindow();

export function ProjectSettings(props: {
  startingPane: "general" | "appearance";
}) {
  const store = getStore();
  useEffect(() => {
    // Let Tauri know the window is ready
    emit("window-ready", {
      label: getProjectWindowLabel(store.projectPath, "settings"),
    });
    appWindow.setTitle(`${store.project.name} - Project Settings`);
  }, []);
  const [pane, setPane] = useState(props.startingPane);
  const config = getPlayerConfig();
  console.log(store, config);
  return (
    <section aria-label="Tabbed Interface">
      <div role="tablist" aria-label="Tabs">
        <button
          role="tab"
          aria-selected={pane === "general" ? "true" : "false"}
          aria-controls="pane-general"
          id="tab-general"
          onClick={() => {
            setPane("general");
          }}
        >
          General
        </button>
        <button
          role="tab"
          aria-selected={pane === "appearance" ? "true" : "false"}
          aria-controls="pane-appearance"
          id="tab-appearance"
          onClick={() => {
            setPane("appearance");
          }}
        >
          Appearance
        </button>
      </div>
      <div
        role="tabpanel"
        id="pane-general"
        aria-labelledby="tab-general"
        hidden={pane === "general" ? false : true}
      >
        <p>Content for general</p>
      </div>
      <div
        role="tabpanel"
        id="pane-appearance"
        aria-labelledby="tab-appearance"
        hidden={pane === "appearance" ? false : true}
      >
        <p>Content for appearance</p>
      </div>
    </section>
  );
}
