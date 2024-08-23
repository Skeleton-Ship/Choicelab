import { createRef } from "preact";
import { useEffect } from "preact/hooks";
import { getStore } from "../data/dataStore";
import CellPane from "./inspector/CellPane";
import BranchPane from "./inspector/BranchPane";
import VariablesPane from "./inspector/VariablesPane";

function makeResizable(el: HTMLElement) {
  const resizer = el.querySelector(".resizer");
  if (!resizer) return;

  resizer.addEventListener("mousedown", () => {
    initDrag();
  });

  function initDrag() {
    window.addEventListener("mousemove", doDrag, false);
    window.addEventListener("mouseup", stopDrag, false);
  }

  function doDrag(e: MouseEvent) {
    el.style.width = window.innerWidth - e.clientX + "px";
  }

  function stopDrag() {
    window.removeEventListener("mousemove", doDrag, false);
    window.removeEventListener("mouseup", stopDrag, false);
  }
}

export default function Inspector(props: { update: Function }) {
  // Make resizable
  const ref = createRef();
  useEffect(() => {
    if (!ref.current) return;
    makeResizable(ref.current);
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
      if (node.type === "cell") {
        contents = (
          <>
            <CellPane update={props.update} />
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
    <div id="node-pane" class="pane right" ref={ref}>
      <div class="resizer"></div>
      <div class="pane-contents">{contents}</div>
    </div>
  );
}
