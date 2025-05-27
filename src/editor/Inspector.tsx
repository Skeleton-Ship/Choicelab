import { useEffect, useRef } from "preact/hooks";
import { getStore } from "../data/dataStore";
import { makeResizable } from "./inspector/functions/makeResizable";
import CellPane from "./inspector/CellPane";
import BranchPane from "./inspector/BranchPane";
import VariablesPane from "./inspector/VariablesPane";
import { PreviewPane } from "./inspector/elements/PreviewPane";

export default function Inspector(props: { update: Function }) {
  // Make resizable
  const paneRef = useRef(null);
  useEffect(() => {
    if (!paneRef.current) return;
    makeResizable(paneRef.current);
  }, []);

  // Contents
  let contents = <></>;
  const store = getStore();
  // First, see what view we're in
  const paneInView = store.viewSettings.paneInView;
  if (paneInView === "node-editor") {
    if (store.selectedNodes.length <= 0) {
      // If no node is selected
      contents = <p class="placeholder">No Node Selected</p>;
    } else if (store.selectedNodes.length > 1) {
      // If multiple nodes are selected
      contents = <p class="placeholder">Multiple Nodes Selected</p>;
    } else {
      const node = store.selectedNodes[0];
      const cellPane = <CellPane update={props.update} />;
      const previewPane =
        store.viewSettings.previewVisible === true ? <PreviewPane /> : null;
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
