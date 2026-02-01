import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "preact/hooks";
import { emit, listen } from "@tauri-apps/api/event";
import newProject from "../fs/newProject";
import openProject from "../fs/openProject";
import { showReleaseNotes } from "../utils/showReleaseNotes";
const appWindow = getCurrentWebviewWindow();

function Launcher() {
  useEffect(() => {
    emit("window-ready", {
      label: "launcher",
    });
    listen("menu-request-quit", () => {
      appWindow.close();
    });
    showReleaseNotes();
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
