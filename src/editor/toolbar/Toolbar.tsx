import { createCell, createBranch } from "../../data/createNode";
import insertNewNode from "../flowchart/general/insertNewNode";
import iconBranch from "../../assets/icon-add-branch.svg";
import iconCell from "../../assets/icon-add-cell.svg";
import { getStore } from "../../data/dataStore";
import showPane from "../inspector/functions/showPane";
import { togglePreview } from "../../preview/togglePreview";

function Toolbar(props: { update: Function }) {
  function handleSelectPane(paneName: string) {
    showPane(paneName, props.update);
  }
  const store = getStore();
  const paneInView = store.viewSettings.paneInView;
  const nodeEditorSelectedClass =
    paneInView === "node-editor" ? "selected" : "";
  const variablesSelectedClass = paneInView === "variables" ? "selected" : "";
  const nodeEditorClass = `node-editor ${nodeEditorSelectedClass}`;
  const variablesClass = `variables ${variablesSelectedClass}`;
  return (
    <div id="toolbar" data-tauri-drag-region>
      <div class="toolbar-region add-nodes left">
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
      <div class="toolbar-region spacer"></div>
      <div class="toolbar-region button-group panes right">
        <button
          title="Node Editor"
          class={nodeEditorClass}
          onClick={() => {
            handleSelectPane("node-editor");
          }}
        >
          <div class="icon node-editor">
            <i class="bi bi-lightning-fill"></i>
          </div>
        </button>
        <button
          title="Variables"
          class={variablesClass}
          onClick={() => {
            handleSelectPane("variables");
          }}
        >
          <div class="icon node-editor">
            <i class="bi bi-braces-asterisk"></i>
          </div>
        </button>
      </div>
      <div class="toolbar-region panes">
        <button
          title="Preview"
          class={store.viewSettings.previewVisible === true ? "selected" : ""}
          onClick={() => {
            togglePreview(props.update);
          }}
        >
          <div class="icon preview">
            <i class="bi bi-play-fill"></i>
          </div>
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
