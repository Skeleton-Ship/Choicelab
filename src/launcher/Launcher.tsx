import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "preact/hooks";
import { listen } from "@tauri-apps/api/event";
import newProject from "../fs/newProject";
import openProject from "../fs/openProject";
const appWindow = getCurrentWebviewWindow();

function Launcher() {
  useEffect(() => {
    listen("menu-request-quit", () => {
      appWindow.close();
    });
    listen("tauri://focus", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      appWindow.emit("enable-menu-items", {
        disableItems: [
          "new_cell",
          "new_branch",
          "set_link",
          "disconnect_link",
          "delete_nodes",
          "delete_stem",
        ],
      });
    });
  }, []);
  return (
    <div id="launcher" data-tauri-drag-region>
      <div className="contents">
        <h1>Choicelab</h1>
        <div class="buttons">
          <button
            className="ui-button large"
            onClick={() => {
              newProject("launcher");
            }}
          >
            New Project...
          </button>
          <button className="ui-button large" onClick={openProject}>
            Open Project...
          </button>
        </div>
        <aside id="alpha-alert">
          <span class="icon">⚠️</span>
          <p>
            Choicelab is <strong>alpha software</strong>, so make sure you save
            your work frequently.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default Launcher;
