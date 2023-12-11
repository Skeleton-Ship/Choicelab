import { useState } from "preact/hooks";
import { getBranch } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import { createBranchStem } from "../../../data/createNode";
import elementIsStem from "../general/elementIsStem";
import isNodeSelected from "../selecting/isNodeSelected";
import BranchStemEl from "./BranchStem";
import { Branch, Stem } from "../../../typings";

/**
 * A node that allows the flowchart to "branch off" into one or more possible directions. By default, all branches include a "no match" stem, and usually (though optionally) can add additional branch *stems* to test for possible values in the branch's variable.
 *
 */
export default function BranchEl(props: {
  id: string;
  onClick: Function;
  update: Function;
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const store = getStore();
  const branch: Branch | undefined = getBranch(props.id, store);
  if (!branch) {
    console.error("Branch not found.");
    return <></>;
  }
  // @ts-ignore
  const [previousEvaluatorName, setPreviousEvaluatorName] = useState(
    branch.evaluator.name
  );
  function handleSelectBranch(e: MouseEvent) {
    let target;
    if (e.target !== null) {
      target = e.target as Element;
    }
    if (!target) return;
    if (elementIsStem(target)) return;
    // Un-set stem selection
    store.selectedStem = false;
    setStore(store);
    props.onClick(getBranch(props.id, store));
  }
  function handleSelectStem() {
    props.onClick(getBranch(props.id, store));
  }
  function addBranchStem() {
    const branch: Branch | undefined = getBranch(props.id, store);
    if (!branch) return;
    const stem = createBranchStem("value");
    if (branch.stems) {
      branch.stems.push(stem);
    }
    props.update();
  }
  const selectedNodes = store.selectedNodes;
  const selectedClass = isNodeSelected(props.id, selectedNodes)
    ? "selected"
    : "";
  const branchClass = `branch node ${selectedClass}`;
  // Iterate through links
  const stems: Array<Stem> = branch.stems;
  const stemEls: Array<preact.JSX.Element> = [];
  let stemIndex = 0;
  stems.forEach((stem: Stem) => {
    const stemEl = (
      <BranchStemEl
        key={stem.id}
        id={stem.id}
        index={stemIndex}
        nodeId={props.id}
        onClick={handleSelectStem}
        setProjectData={props.update}
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
    >
      <div className="contents">
        <span className="node-id">{props.id}</span>
        <div className="evaluator-name">
          <span>Evaluator goes here</span>
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
