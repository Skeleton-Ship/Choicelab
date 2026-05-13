import { getBranch } from "../../../data/getData";
import { getStore, getViewStore, setStore } from "../../../data/dataStore";
import { createBranchStem } from "../../../data/createNode";
import elementIsStem from "../general/elementIsStem";
import isNodeSelected from "../selecting/isNodeSelected";
import BranchStemEl from "./BranchStem";
import { Branch, Stem } from "../../../typings";
import handleSelectNode from "../selecting/handleSelectNode";

/**
 * A node that allows the flowchart to "branch off" into one or more possible directions. By default, all branches include a "no match" stem, and usually (though optionally) can add additional branch *stems* to test for possible values in the branch's variable.
 *
 */
export default function BranchEl(props: {
  id: string;
  x: number;
  y: number;
  left: number;
  top: number;
  width?: number;
  height?: number;
  update: Function;
}) {
  const store = getStore(),
    viewStore = getViewStore();
  const branch: Branch | undefined = getBranch(props.id, store);
  if (!branch) {
    console.error("Branch not found.");
    return <></>;
  }
  // Make sure the click is the actual branch el, not one of the stems
  function handleSelectBranch(e: MouseEvent) {
    let target;
    if (e.target !== null) {
      target = e.target as Element;
    }
    if (!target) return;
    if (elementIsStem(target)) return;
    if (branch) handleSelectNode(branch, props.update);
  }
  function addBranchStem() {
    const store = getStore();
    const branch: Branch | undefined = getBranch(props.id, store);
    if (!branch) return;
    // Create the new stem
    const stem = createBranchStem("rules");
    branch.stems.push(stem);
    // Re-sort stems so no-match is last
    const newStems: Array<Stem> = [];
    let noMatchStem;
    branch.stems.forEach((stem: Stem) => {
      if (stem.type === "noMatch") {
        noMatchStem = stem;
      } else {
        newStems.push(stem);
      }
    });
    if (noMatchStem) {
      newStems.push(noMatchStem);
    }
    branch.stems = newStems;
    // Update
    setStore(store);
    props.update();
  }
  const selectedNodes = viewStore.selectedNodes;
  const selectedClass = isNodeSelected(props.id, selectedNodes)
    ? "selected"
    : "";
  const targetModeClass =
    viewStore.targetMode.nodeId === props.id ? "target-mode-origin" : "";
  const branchClass = `branch node ${selectedClass} ${targetModeClass}`;
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
        update={props.update}
      />
    );
    stemEls.push(stemEl);
    stemIndex++;
  });
  const stemButtonDisabled = stems.length >= 10 ? true : false;
  const style = {
    top: props.top + "px",
    left: props.left + "px",
    ...(props.width !== undefined && { width: props.width + "px" }),
    ...(props.height !== undefined && { height: props.height + "px" }),
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
        <button
          disabled={stemButtonDisabled}
          onClick={addBranchStem}
          className="add-stem ui-button"
          tabindex={-1}
        >
          +
        </button>
      </div>
      <ul className="stems">{stemEls}</ul>
      <svg
        class="branch-background"
        width="866"
        height="302"
        viewBox="0 0 866 302"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          id="Path"
          fill-rule="evenodd"
          stroke-linecap="round"
          d="M 428.703125 4.203125 L 435.84375 6.15625 L 853.609375 146.765625 L 859.96875 149.53125 L 858.84375 150.15625 L 847.625 154.3125 L 431.28125 296.34375 L 427.609375 296.984375 L 425.28125 296.890625 L 422.1875 296.171875 L 10.484375 152.28125 L 5.75 150.03125 L 5.03125 149.453125 L 6.59375 148.359375 L 9.5625 147.03125 L 422.0625 4.859375 L 425.09375 4.1875 Z"
        />
      </svg>
    </li>
  );
}
