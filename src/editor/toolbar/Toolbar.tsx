import { createCell, createBranch } from "../../data/createNode";
import insertNewNode from "../sequence/general/insertNewNode";

function Toolbar(props: { update: Function }) {
  return (
    <div id="toolbar" data-tauri-drag-region>
      <button
        title="Add Cell"
        onClick={() => {
          const newCell = createCell();
          insertNewNode(newCell, props.update);
        }}
      >
        <div className="icon new-cell"></div>
        <span>Add Cell</span>
      </button>
      <button
        title="Add Branch"
        onClick={() => {
          const newBranch = createBranch();
          insertNewNode(newBranch, props.update);
        }}
      >
        <div className="icon new-branch"></div>
        <span>Add Branch</span>
      </button>
    </div>
  );
}

export default Toolbar;
