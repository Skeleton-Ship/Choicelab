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
  const toolbarIconSize = 34;
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
  const nodeEditorSelectedClass =
    paneInView === "node-editor" ? "selected" : "";
  const variablesSelectedClass = paneInView === "variables" ? "selected" : "";
  const nodeEditorClass = `node-editor ${nodeEditorSelectedClass}`;
  const variablesClass = `variables ${variablesSelectedClass}`;
  return (
    <div class="ui-toolbar" id="toolbar" data-tauri-drag-region>
      <div class="toolbar-region add-nodes left">
        <button
          title="Add Cell"
          onClick={() => {
            const newCell = createCell();
            insertNewNode(newCell, props.update);
          }}
        >
          <div className="icon new-cell">
            <NewCellIcon
              size={toolbarIconSize}
              darkMode={currentTheme === "dark"}
            />
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
            <NewBranchIcon
              size={toolbarIconSize}
              darkMode={currentTheme === "dark"}
            />
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
            <LightningIcon
              size={toolbarIconSizeTall}
              state={
                viewStore.viewSettings.paneInView !== "node-editor"
                  ? "Inactive"
                  : ""
              }
              darkMode={currentTheme === "dark"}
            />
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
            <VariablesIcon
              size={toolbarIconSize}
              state={
                viewStore.viewSettings.paneInView !== "variables"
                  ? "Inactive"
                  : ""
              }
              darkMode={currentTheme === "dark"}
            />
          </div>
        </button>
      </div>
      <div class="toolbar-region panes">
        <button
          title="Preview"
          class={
            viewStore.viewSettings.previewVisible === true ? "selected" : ""
          }
          onClick={() => {
            togglePreview(props.update);
          }}
        >
          <div class="icon preview">
            <PlayIcon
              size={toolbarIconSizeTall}
              state={
                viewStore.viewSettings.previewVisible !== true ? "Inactive" : ""
              }
              darkMode={currentTheme === "dark"}
            />
          </div>
        </button>
      </div>
      <div id="update"></div>
    </div>
  );
}

export default Toolbar;
