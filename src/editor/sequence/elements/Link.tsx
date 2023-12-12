import { useEffect } from "preact/hooks";
import { getBranchStem } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import { getNode } from "../../../data/getData";
import elementIsNode from "../general/elementIsNode";
import { Store, Stem, AnyNode, Link } from "../../../typings";
/**
 * A component that lives in cells and branch stems that: 1) indicates the node the cell/stem connects to, 2) provides a means of setting the link destination.
 *
 */
export default function LinkEl(props: {
  origin: string;
  nodeId: string;
  stemId?: string;
  update: Function;
}) {
  // Get link property
  function getLinkProps(store: Store) {
    const node: AnyNode | undefined = getNode(props.nodeId, store);
    if (typeof node === "undefined") {
      console.error("Node not found.");
      return;
    }
    let link: Link | undefined;
    if (props.origin === "cell" || props.origin === "start") {
      link = node.link;
    }
    if (props.origin === "branchStem" && typeof props.stemId !== "undefined") {
      const stem: Stem | undefined = getBranchStem(
        props.stemId,
        props.nodeId,
        store
      );
      if (typeof stem === "undefined") {
        console.error("No stem found.");
        return;
      }
      link = stem.link;
    }
    return link;
  }
  function enterTargetMode() {
    // Add target mode to node class
    const nodeEl: HTMLElement | null = document.querySelector(
      `.node[data-id="${props.nodeId}"]`
    );
    if (nodeEl === null) {
      console.error(
        "Couldn't enter target mode because node element was not found."
      );
      return;
    }
    nodeEl.setAttribute("data-target-mode-enabled", "");
    // Update target mode
    const store = getStore();
    const targetModeId =
      props.origin === "cell" || props.origin === "start"
        ? props.nodeId
        : props.stemId;
    if (typeof targetModeId === "undefined") {
      console.error("No target mode ID could be identified.");
      return;
    }
    store.targetMode = targetModeId;
    // Update app attribute
    const app = document.querySelector("#App");
    if (app) {
      app.setAttribute("data-target-mode", targetModeId);
    }
    // Update data
    setStore(store);
    props.update(false);
  }
  function exitTargetMode(action: string = "") {
    const store = getStore();
    // Remove target mode class from node
    const nodeEl: HTMLElement | null = document.querySelector(
      `.node[data-id="${props.nodeId}"]`
    );
    if (nodeEl === null) {
      console.error("Node element could not be found.");
      return;
    }
    nodeEl.removeAttribute("data-target-mode-enabled");
    // If disconnecting, update
    if (action === "disconnect") {
      let linkObj: AnyNode | undefined;
      if (
        props.origin === "branchStem" &&
        typeof props.stemId !== "undefined"
      ) {
        linkObj = getBranchStem(props.stemId, props.nodeId, store);
      } else {
        linkObj = getNode(props.nodeId, store);
      }
      if (typeof linkObj === "undefined") {
        console.error("No link object found.");
        return;
      }
      if (linkObj.link) {
        linkObj.link.to = "";
      }
      props.update(true);
    } else {
      props.update(false);
    }
    // Update target mode
    store.targetMode = "";
    setStore(store);
    // Take DOM out of target mode
    const app = document.querySelector("#App");
    if (app) {
      app.setAttribute("data-target-mode", "");
    }
  }
  let targetModeListener = window.__CHOICELAB_TARGET_MODE__;
  useEffect(() => {
    if (targetModeListener !== false) return;
    targetModeListener = document.addEventListener("click", (e) => {
      const store = getStore();
      const targetMode = store.targetMode;
      if (props.origin === "cell" || props.origin === "start") {
        if (targetMode !== props.nodeId) return;
      }
      if (props.origin === "branchStem") {
        if (targetMode !== props.stemId) return;
      }
      let target;
      if (e.target !== null) {
        target = e.target as Element;
      }
      if (target) {
        const selectedNode = elementIsNode(target);
        if (selectedNode) {
          const destinationId = selectedNode.getAttribute("data-id");
          if (destinationId && destinationId !== props.nodeId) {
            const link = getLinkProps(store);
            if (link) {
              link.to = destinationId;
              setStore(store);
              props.update();
              exitTargetMode();
            }
          }
        }
      }
    });
  }, []);
  const store = getStore();
  const targetMode = store.targetMode;
  let targetModeContents = (
    <div className="target-mode">
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
            exitTargetMode();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
  if (props.origin === "cell" || props.origin === "start") {
    if (targetMode !== props.nodeId) targetModeContents = <></>;
  }
  if (props.origin === "branchStem") {
    if (targetMode !== props.stemId) targetModeContents = <></>;
  }
  // Get current to destination
  const link = getLinkProps(store);
  let toId = link && link.to ? link.to : "";
  return (
    <div className="link">
      <button className="linker" onClick={enterTargetMode}>
        <span>Connect</span>
      </button>
      {targetModeContents}
      <div className="to-id">{toId}</div>
    </div>
  );
}
