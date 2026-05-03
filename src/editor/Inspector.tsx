import { useEffect, useRef } from "preact/hooks";
import { getStore, getViewStore } from "../data/dataStore";
import { getPlayerSettings } from "../data/getData";
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
  const previewRef = useRef(null);
  useEffect(() => {
    if (!paneRef.current) return;
    makeResizable(paneRef.current);
        if (!previewRef.current) return;
    makeResizable(previewRef.current);
  }, []);

  // Menu listeners
  useEffect(() => {
    const unlistenNodeEditor = appWindow.listen<{ label: string }>("menu-show-node-editor", (event) => {
      if (event.payload.label !== appWindow.label) return;
      showPane("node-editor", props.update);
    });
    const unlistenVariables = appWindow.listen<{ label: string }>("menu-show-variables", (event) => {
      if (event.payload.label !== appWindow.label) return;
      showPane("variables", props.update);
    });
    return () => {
      unlistenNodeEditor.then((fn) => fn());
      unlistenVariables.then((fn) => fn());
    };
  }, []);

  // Contents
  let contents = <></>;
  const viewStore = getViewStore();
  const appearance = getPlayerSettings(getStore(), "appearance");
  const previewBackgroundColor =
    appearance?.background?.kind === "color"
      ? appearance.background.color
      : undefined;
  // First, see what view we're in
  const paneInView = viewStore.viewSettings.paneInView;
  const previewPane =
    viewStore.viewSettings.previewVisible === true ? <PreviewPane /> : null;
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
      if (node.type === "start") {
        contents = <p class="placeholder">No Options Available</p>;
      }
      if (node.type === "cell") {
        contents = <>{cellPane}</>;
      } else if (node.type === "branch") {
        contents = (
          <>
            <BranchPane update={props.update} />
          </>
        );
      }
    }
  }
  return (
    <div id="inspector" class="pane right" ref={paneRef}>
      <div class="resizer horizontal"></div>
      <div
        role="tabpanel"
        id="panel-preview"
        aria-labelledby="tab-preview"
        ref={previewRef}
        hidden={!viewStore.viewSettings.previewVisible}
        style={previewBackgroundColor ? { backgroundColor: previewBackgroundColor } : undefined}
      >
        {previewPane}
        <div class="resizer vertical"></div>
      </div>
      <div
        role="tabpanel"
        id="panel-node-editor"
        aria-labelledby="tab-node-editor"
        hidden={paneInView !== "node-editor"}
      >
        {paneInView === "node-editor" ? contents : null}
      </div>
      <div
        role="tabpanel"
        id="panel-variables"
        aria-labelledby="tab-variables"
        hidden={paneInView !== "variables"}
      >
        {paneInView === "variables" ? (
          <VariablesPane update={props.update} />
        ) : null}
      </div>
    </div>
  );
}
