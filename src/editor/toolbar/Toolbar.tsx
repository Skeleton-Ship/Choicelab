import { createCell, createBranch } from "../../data/createNode";
import insertNewNode from "../sequence/general/insertNewNode";
import iconBranch from "../../assets/icon-add-branch.svg";
import iconCell from "../../assets/icon-add-cell.svg";

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
        <div className="icon new-cell">
          <img src={iconCell} alt="Add Cell" />
        </div>
      </button>
      <button
        title="Add Branch"
        onClick={() => {
          const newBranch = createBranch();
          insertNewNode(newBranch, props.update);
        }}
      >
        <div className="icon new-branch">
          <img src={iconBranch} alt="Add Branch" />
        </div>
      </button>
    </div>
  );
}

export default Toolbar;
