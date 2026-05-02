import { useEffect, useState, useRef } from "preact/hooks";
import { getSequence } from "../data/getData";
import positionNodes from "./flowchart/linking/positionNodes";
import drawArrows from "./flowchart/linking/drawArrows";
import scrollNodeIntoView from "./flowchart/general/scrollNodeIntoView";
import setSequenceDimensions from "./flowchart/general/setSequenceDimensions";
import { Sequence, AnyNode } from "../typings";
import { getViewStore, setViewStore, updateView } from "../data/dataStore";
import inTextElement from "../utils/inTextElement";
import { getFocusedRegion } from "../utils/focusedRegion";
import handleKeyNavigation from "./flowchart/general/handleKeyNavigation";

// Elements
import StartEl from "./flowchart/elements/Start";
import CellEl from "./flowchart/elements/Cell";
import BranchEl from "./flowchart/elements/Branch";
import ViewSlider from "./flowchart/ViewSlider";

/**
 * A sequence contains a series of nodes (cells and branches), and arranges them in the order they are linked. The sequence also houses a number of events related to adding and deleting nodes.
 *
 */
export default function SequenceEl(props: { id: string; update: Function }) {
  // Set up selection
  // @ts-ignore
  const [selectedNodes, setSelectedNodes] = useState<AnyNode[]>([]);
  ("");
  // Listeners for arrows
  const arrowsRef = useRef(null);
  const svgRef = useRef(null);
  // On mount...
  useEffect(() => {
    // Set shift, arrow key events
    const keydownHandler = (e: KeyboardEvent) => {
      if (
        getFocusedRegion() === "sequence" &&
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight")
      ) {
        e.preventDefault();
        handleKeyNavigation(e.key, props.update);
      }
    };
    const keyupHandler = (e: KeyboardEvent) => {};
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("keyup", keyupHandler);
    return () => {
      document.removeEventListener("keydown", keydownHandler);
      document.removeEventListener("keyup", keyupHandler);
    };
  }, []);
  // On each refresh...
  useEffect(() => {
    // Draw arrows
    if (arrowsRef.current && svgRef.current) {
      drawArrows(arrowsRef.current, svgRef.current);
    }
    // Set height of sequence
    setSequenceDimensions();
    // Scroll current node into view
    scrollNodeIntoView();
  });
  // Get sequence
  const positionedData = positionNodes(props.id);
  const sequence: Sequence | undefined = getSequence(props.id, positionedData);
  if (typeof sequence === "undefined") {
    console.error("Sequence not found.");
    return <></>;
  }
  // Get nodes in sequence
  const nodes = sequence.nodes;
  const nodeEls: Array<preact.JSX.Element> = [];
  nodes.forEach((node: AnyNode) => {
    if (typeof node.position === "undefined") {
      console.error("No node position found.");
      return;
    }
    const nodeProps = {
      key: node.id,
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      top: node.position.top,
      left: node.position.left,
      width: node.position.width,
      height: node.position.height,
      update: props.update,
    };
    let nodeEl: preact.JSX.Element = <></>;
    if (node.type === "cell") {
      nodeEl = <CellEl {...nodeProps} />;
    } else if (node.type === "branch") {
      nodeEl = <BranchEl {...nodeProps} />;
    } else if (node.type === "start") {
      nodeEl = <StartEl {...nodeProps} />;
    }
    nodeEls.push(nodeEl);
  });
  const viewStore = getViewStore();
  const targetModeClass =
    viewStore.targetMode.active === true ? "target-mode" : "";
  return (
    <div id="sequence-wrap" tabindex={0} class={targetModeClass}>
      <div id="sequence" key={props.id}>
        <ul className="nodes" ref={arrowsRef}>
          {nodeEls}
        </ul>
        <svg id="arrows" ref={svgRef}></svg>
      </div>
      <ViewSlider update={props.update} />
    </div>
  );
}
