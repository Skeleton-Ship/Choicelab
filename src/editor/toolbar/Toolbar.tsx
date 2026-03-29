import { createCell, createBranch } from "../../data/createNode";
import insertNewNode from "../flowchart/general/insertNewNode";
import { getViewStore } from "../../data/dataStore";
import showPane from "../inspector/functions/showPane";
import { togglePreview } from "../../preview/togglePreview";
import { NewCellIcon, VariablesIcon } from "../shared/ColorIcon";
import { NewBranchIcon } from "../shared/ColorIcon";
import { PlayIcon } from "../shared/ColorIcon";
import { LightningIcon } from "../shared/ColorIcon";
import { useState, useEffect } from "preact/hooks";
import { getCurrentWindow } from "@tauri-apps/api/window";

function Toolbar(props: { update: Function }) {
  const toolbarIconSize = 36;
  const toolbarIconSizeTall = 28;
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    getCurrentWindow()
      .theme()
      .then((theme) => {
        console.log(theme);
        setCurrentTheme(theme || "light");
      });
    let unlisten: (() => void) | null = null;
    getCurrentWindow()
      .onThemeChanged(({ payload: theme }) => {
        setCurrentTheme(theme);
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => {
      if (unlisten) unlisten();
    };
  }, []);
  function handleSelectPane(paneName: string) {
    showPane(paneName, props.update);
  }
  const viewStore = getViewStore();
  const paneInView = viewStore.viewSettings.paneInView;
  return (
    <div class="ui-toolbar" id="toolbar" data-tauri-drag-region>
      <div class="toolbar-region add-nodes left">
        <button
          title="Add Cell"
          id="button-add-cell"
          onClick={() => {
            const newCell = createCell();
            insertNewNode(newCell, props.update);
          }}
        >
          <NewCellIcon
            size={toolbarIconSize}
            darkMode={currentTheme === "dark"}
          />
          <span>Add Cell</span>
        </button>
        <button
          title="Add Branch"
          id="button-add-branch"
          onClick={() => {
            const newBranch = createBranch();
            insertNewNode(newBranch, props.update);
          }}
        >
          <NewBranchIcon
            size={toolbarIconSize}
            darkMode={currentTheme === "dark"}
          />
          <span>Add Branch</span>
        </button>
      </div>
      <div class="toolbar-region spacer" data-tauri-drag-region></div>
      <div
        class="toolbar-region right"
        role="tablist"
        aria-label="Inspector Pane"
      >
        <button
          role="tab"
          aria-selected={paneInView === "node-editor" ? "true" : "false"}
          aria-controls="panel-node-editor"
          id="tab-node-editor"
          title="Node Editor"
          onClick={() => {
            handleSelectPane("node-editor");
          }}
        >
          <LightningIcon
            size={toolbarIconSizeTall}
            state={paneInView !== "node-editor" ? "Inactive" : ""}
            darkMode={currentTheme === "dark"}
          />
          <span>Node Editor</span>
        </button>
        <button
          role="tab"
          aria-selected={paneInView === "variables" ? "true" : "false"}
          aria-controls="panel-variables"
          id="tab-variables"
          title="Variables"
          onClick={() => {
            handleSelectPane("variables");
          }}
        >
          <VariablesIcon
            size={toolbarIconSize}
            state={paneInView !== "variables" ? "Inactive" : ""}
            darkMode={currentTheme === "dark"}
          />
          <span>Variables</span>
        </button>
      </div>
      <div class="toolbar-region panes">
        <button
          title="Preview"
          aria-selected={viewStore.viewSettings.previewVisible === true}
          aria-controls="panel-preview"
          id="tab-preview"
          class={
            viewStore.viewSettings.previewVisible === true ? "selected" : ""
          }
          onClick={() => {
            togglePreview(props.update);
          }}
        >
          <PlayIcon
            size={toolbarIconSizeTall}
            state={
              viewStore.viewSettings.previewVisible !== true ? "Inactive" : ""
            }
            darkMode={currentTheme === "dark"}
          />
          <span>Preview</span>
        </button>
      </div>
      <div id="update"></div>
    </div>
  );
}

export default Toolbar;
