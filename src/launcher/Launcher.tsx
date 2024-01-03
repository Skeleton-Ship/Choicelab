import { appWindow } from "@tauri-apps/api/window";
import { useEffect } from "preact/hooks";
import { listen } from "@tauri-apps/api/event";
import newProject from "../fs/newProject";
import openProject from "../fs/openProject";

function Launcher() {
  useEffect(() => {
    listen("menu-request-quit", () => {
      appWindow.close();
    });
  }, []);
  return (
    <div id="launcher" data-tauri-drag-region>
      <div className="contents">
        <h1>Choicelab</h1>
        <div class="buttons">
          <button className="ui-button large" onClick={newProject}>
            New Project...
          </button>
          <button className="ui-button large" onClick={openProject}>
            Open Project...
          </button>
        </div>
        <aside id="alpha-alert">
          <span class="icon">⚠️</span>
          <p>
            Choicelab is <strong>alpha software</strong>. Use with caution and
            save your work frequently.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default Launcher;
