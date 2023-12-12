import { useEffect, useState, useRef } from "preact/hooks";
import StartEl from "./elements/Start";
import CellEl from "./elements/Cell";
import BranchEl from "./elements/Branch";
// import { getStore, setStore } from "../../data/dataStore";
import { getSequence } from "../../data/getData";
import runSequenceEvents from "./general/runSequenceEvents";
import handleSelectNode from "./selecting/handleSelectNode";
import positionNodes from "./linking/positionNodes";
import drawArrows from "./linking/drawArrows";
import setSequenceDimensions from "./general/setSequenceDimensions";
import { Sequence, AnyNode } from "../../typings";

/**
 * A sequence contains a series of nodes (cells and branches), and arranges them in the order they are linked. The sequence also houses a number of events related to adding and deleting nodes, which can be found in runSequenceEvents.
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
    // Run sequence events
    runSequenceEvents({
      id: props.id,
      update: props.update,
    });
  }, []);
  // On each refresh...
  useEffect(() => {
    // Draw arrows
    if (arrowsRef.current && svgRef.current) {
      drawArrows(arrowsRef.current, svgRef.current);
    }
    // Set height of sequence
    setSequenceDimensions();
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
      onClick: () => {
        handleSelectNode(node, setSelectedNodes);
      },
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
  return (
    <div id="sequence-wrap">
      <div id="sequence" key={props.id}>
        <ul className="nodes" ref={arrowsRef}>
          {nodeEls}
        </ul>
        <svg id="arrows" ref={svgRef}></svg>
      </div>
    </div>
  );
}
