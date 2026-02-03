import { useEffect, useRef } from "preact/hooks";
import { listen } from "@tauri-apps/api/event";
import { getViewStore } from "../data/dataStore";
import showPane from "./inspector/functions/showPane";
import { makeResizable } from "./inspector/functions/makeResizable";
import CellPane from "./inspector/CellPane";
import BranchPane from "./inspector/BranchPane";
import VariablesPane from "./inspector/VariablesPane";
import { PreviewPane } from "./inspector/elements/PreviewPane";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
const appWindow = getCurrentWebviewWindow();

export default function Inspector(props: { update: Function }) {
  // Make resizable
  const paneRef = useRef(null);
  useEffect(() => {
    if (!paneRef.current) return;
    makeResizable(paneRef.current);
  }, []);

  // Menu listeners
  // TODO: Remove focus and narrow listener scope to window
  listen("menu-show-node-editor", async () => {
    const focused = await appWindow.isFocused();
    if (!focused) return;
    showPane("node-editor", props.update);
  });

  listen("menu-show-variables", async () => {
    const focused = await appWindow.isFocused();
    if (!focused) return;
    showPane("variables", props.update);
  });

  // Contents
  let contents = <></>;
  const viewStore = getViewStore();
  // First, see what view we're in
  const paneInView = viewStore.viewSettings.paneInView;
  if (paneInView === "node-editor") {
    if (viewStore.selectedNodes.length <= 0) {
      // If no node is selected
      contents = <p class="placeholder">No Node Selected</p>;
    } else if (viewStore.selectedNodes.length > 1) {
      // If multiple nodes are selected
      contents = <p class="placeholder">Multiple Nodes Selected</p>;
    } else {
      const node = viewStore.selectedNodes[0];
      const cellPane = <CellPane update={props.update} />;
      const previewPane =
        viewStore.viewSettings.previewVisible === true ? <PreviewPane /> : null;
      if (node.type === "start") {
        contents = <>{previewPane}</>;
      }
      if (node.type === "cell") {
        contents = (
          <>
            {previewPane}
            {cellPane}
          </>
        );
      } else if (node.type === "branch") {
        contents = (
          <>
            <BranchPane update={props.update} />
          </>
        );
      }
    }
  } else if (paneInView === "variables") {
    contents = <VariablesPane update={props.update} />;
  }
  return (
    <div id="node-pane" class="pane right" ref={paneRef}>
      <div class="resizer horizontal"></div>
      <div class="pane-contents">{contents}</div>
    </div>
  );
}
