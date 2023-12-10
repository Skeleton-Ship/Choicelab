import newProject from "../fs/newProject";
import openProject from "../fs/openProject";

function Launcher() {
  return (
    <div id="launcher">
      <div className="contents">
        <h1>Choicelab</h1>
        <button className="ui-button" onClick={newProject}>
          New Project...
        </button>
        <button className="ui-button" onClick={openProject}>
          Open Project...
        </button>
      </div>
    </div>
  );
}

export default Launcher;
