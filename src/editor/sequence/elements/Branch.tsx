import { useState } from "react";
import { getNode } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import { createBranchStem } from "../../../data/createNode";
import elementIsStem from "../general/elementIsStem";
import isNodeSelected from "../selecting/isNodeSelected";
import BranchStem from "./BranchStem";
import Label from "./Label";

/**
 * A node that allows the flowchart to "branch off" into one or more possible directions. By default, all branches include a "no match" stem, and usually (though optionally) can add additional branch *stems* to test for possible values in the branch's variable.
 *
 */
export default function Branch(props: {
  id: string;
  onClick: Function;
  setProjectData: Function;
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const projectData = getProject();
  const branch: any = getNode(props.id, projectData);
  const [previousEvaluatorName, setPreviousEvaluatorName] = useState(
    branch.evaluator.name
  );
  function handleSelectBranch(e: any) {
    if (elementIsStem(e.target)) return;
    // Un-set stem selection
    setStore({
      selectedStem: false,
    });
    props.onClick(getNode(props.id, projectData));
  }
  function handleSelectStem() {
    props.onClick(getNode(props.id, projectData));
  }
  function addBranchStem() {
    const branch: any = getNode(props.id, projectData);
    if (typeof branch === "undefined") return;
    const stem = createBranchStem("value");
    if (branch.stems) {
      branch.stems.push(stem);
    }
    props.setProjectData(projectData);
  }
  const selectedNodes = getStore("selectedNodes");
  const selectedClass = isNodeSelected(props.id, selectedNodes)
    ? "selected"
    : "";
  const selectedStem = getStore("selectedStem");
  const branchClass = `branch node ${selectedClass}`;
  // Iterate through links
  const stems: any = branch.stems;
  const stemEls: any = [];
  let stemIndex = 0;
  stems.forEach((stem: any) => {
    const stemEl = (
      <BranchStem
        key={stem.id}
        id={stem.id}
        index={stemIndex}
        nodeId={props.id}
        onClick={handleSelectStem}
        setProjectData={props.setProjectData}
      />
    );
    stemEls.push(stemEl);
    stemIndex++;
  });
  const stemButtonDisabled = stems.length >= 10 ? true : false;
  const style = {
    top: props.top + "px",
    left: props.left + "px",
    width: props.width + "px",
    height: props.height + "px",
  };
  return (
    <li
      className={branchClass}
      onClick={handleSelectBranch}
      data-id={props.id}
      data-position-x={props.x}
      data-position-y={props.y}
      data-element="branch"
      style={style}
      draggable
    >
      <div className="contents">
        <span className="node-id">{props.id}</span>
        <div className="evaluator-name">
          <Label
            text={branch.evaluator.name}
            textProp="evaluator.name"
            placeholder="variable"
            nodeId={props.id}
            setProjectData={props.setProjectData}
          />
        </div>
        <button
          disabled={stemButtonDisabled}
          onClick={addBranchStem}
          className="add-stem"
        >
          +
        </button>
      </div>
      <ul className="stems">{stemEls}</ul>
    </li>
  );
}
