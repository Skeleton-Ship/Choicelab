import newProject from "../fs/newProject";
import openProject from "../fs/openProject";

function Launcher() {
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
            Choicelab is <strong>alpha software</strong> that may cause crashes
            or data loss. Use with caution and back up your information
            regularly.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default Launcher;
