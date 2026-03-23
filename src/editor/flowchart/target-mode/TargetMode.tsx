import { useEffect } from "preact/hooks";
import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../../../data/dataStore";
import { AnyNode } from "../../../typings";
import { getNode, getBranchStem } from "../../../data/getData";
import elementIsNode from "../../flowchart/general/elementIsNode";

export default function TargetMode(props: { update: Function }) {
  // Functions
  function exitTargetMode(linkTo: string | false) {
    const store = getStore(),
      viewStore = getViewStore();
    const targetMode = viewStore.targetMode;
    let updateHistory = false;
    if (linkTo !== false && linkTo !== "disconnect") {
      let originLink;
      if (targetMode.stemId && targetMode.stemId !== "") {
        originLink = getBranchStem(targetMode.stemId, targetMode.nodeId, store);
      } else {
        originLink = getNode(targetMode.nodeId, store);
      }
      if (originLink && originLink.link) {
        originLink.link.to = linkTo;
        updateHistory = true;
      }
    } else if (linkTo === "disconnect") {
      let linkObj: AnyNode | undefined;
      if (
        targetMode.origin === "branchStem" &&
        typeof targetMode.stemId !== "undefined"
      ) {
        linkObj = getBranchStem(targetMode.stemId, targetMode.nodeId, store);
      } else {
        linkObj = getNode(targetMode.nodeId, store);
      }
      if (typeof linkObj === "undefined") {
        console.error("No link object found.");
        return;
      }
      if (linkObj.link) {
        linkObj.link.to = "";
      }
      updateHistory = true;
    }
    viewStore.targetMode = {
      active: false,
      origin: "",
      nodeId: "",
    };
    setStore(store);
    setViewStore(viewStore);
    props.update(updateHistory);
  }
  useEffect(() => {
    // Activate click event when target mode is active
    const sequenceEl = document.querySelector("#sequence-wrap")!;
    const clickHandler = (e: Event) => {
      const viewStore = getViewStore();
      if (viewStore.targetMode.active === false) return;
      e.preventDefault();
      // Validate target
      const target = e.target;
      if (target === null) return;
      const targetEl = target as Element;
      const destinationEl = elementIsNode(targetEl);
      if (destinationEl === false) return;
      // Get node ID
      const targetMode = viewStore.targetMode;
      const destinationId = destinationEl.getAttribute("data-id");
      if (destinationId && destinationId !== targetMode.nodeId) {
        exitTargetMode(destinationId);
      }
    };
    sequenceEl.addEventListener("click", clickHandler);
    return () => {
      sequenceEl.removeEventListener("click", clickHandler);
    };
  }, []);
  // Elements
  const initialStore = getViewStore();
  let targetModeEl = <></>;
  if (initialStore.targetMode.active === true) {
    targetModeEl = (
      <div id="target-mode">
        <p>Choose a destination, or:</p>
        <div className="buttons">
          <button
            className="ui-button"
            onClick={() => {
              exitTargetMode("disconnect");
            }}
          >
            Disconnect
          </button>
          <button
            className="ui-button"
            onClick={() => {
              exitTargetMode(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return targetModeEl;
}
