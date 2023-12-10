import { useEffect } from "react";
import { getBranchStem } from "../../../data/getData";
import { getStore, setStore, getProject } from "../../../data/dataStore";
import { getNode } from "../../../data/getData";
import elementIsNode from "../general/elementIsNode";

/**
 * A component that lives in cells and branch stems that: 1) indicates the node the cell/stem connects to, 2) provides a means of setting the link destination.
 *
 * @param {string} origin - Whether the parent element is a cell or a branch stem.
 * @param {string} nodeId - The ID of the parent node (either a cell or a branch).
 * @param {string} stemId - The ID of the stem, if applicable.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function Link(props: {
  origin: string;
  nodeId: string;
  stemId?: any;
  setProjectData: any;
}): JSX.Element {
  // Get link property
  function getLinkProps(projectData: any) {
    const node: any = getNode(props.nodeId, projectData);
    let link: any = null;
    if (props.origin === "cell" || props.origin === "start") {
      link = node.link;
    }
    if (props.origin === "branchStem") {
      const stem: any = getBranchStem(props.stemId, props.nodeId, projectData);
      link = stem.link;
    }
    return link;
  }
  function enterTargetMode() {
    // Add target mode to node class
    const nodeEl: any = document.querySelector(
      `.node[data-id="${props.nodeId}"]`
    );
    nodeEl.setAttribute("data-target-mode-enabled", "");
    // Update target mode
    const targetModeId =
      props.origin === "cell" || props.origin === "start"
        ? props.nodeId
        : props.stemId;
    setStore({ targetMode: targetModeId });
    // Update data
    const projectData = getProject();
    props.setProjectData(false);
    const app = document.querySelector("#App");
    if (app) {
      app.setAttribute("data-target-mode", targetModeId);
    }
  }
  function exitTargetMode(action: string = "") {
    const projectData = getProject();
    // Remove target mode class from node
    const nodeEl: any = document.querySelector(
      `.node[data-id="${props.nodeId}"]`
    );
    nodeEl.removeAttribute("data-target-mode-enabled");
    // If disconnecting, update
    if (action === "disconnect") {
      let linkObj: any = getNode(props.nodeId, projectData);
      if (props.origin === "branchStem") {
        linkObj = getBranchStem(props.stemId, props.nodeId, projectData);
      }
      if (linkObj.link) {
        linkObj.link.to = "";
      }
    }
    // Update target mode
    setStore({ targetMode: "" });
    // Update data
    if (action === "disconnect") {
      props.setProjectData(projectData, true);
    } else {
      props.setProjectData(false);
    }
    // Take DOM out of target mode
    const app = document.querySelector("#App");
    if (app) {
      app.setAttribute("data-target-mode", "");
    }
  }
  let targetModeListener = (window as any).Choicelab.targetModeListener;
  useEffect(() => {
    if (targetModeListener !== false) return;
    targetModeListener = document.addEventListener("click", (e) => {
      const targetMode = getStore("targetMode");
      if (props.origin === "cell" || props.origin === "start") {
        if (targetMode !== props.nodeId) return;
      }
      if (props.origin === "branchStem") {
        if (targetMode !== props.stemId) return;
      }
      const selectedNode = elementIsNode(e.target);
      if (selectedNode) {
        const destinationId = selectedNode.getAttribute("data-id");
        if (destinationId !== props.nodeId) {
          const projectData = getProject();
          const link = getLinkProps(projectData);
          link.to = destinationId;
          props.setProjectData(projectData);
          exitTargetMode();
        }
      }
    });
  }, []);
  const targetMode = getStore("targetMode");
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
  const projectData = getProject();
  const link = getLinkProps(projectData);
  return (
    <div className="link">
      <button className="linker" onClick={enterTargetMode}>
        <span>Connect</span>
      </button>
      {targetModeContents}
      <div className="to-id">{link.to}</div>
    </div>
  );
}
