import { useEffect, useState, useRef } from "react";
import Branch from "./elements/Branch";
import Cell from "./elements/Cell";
import Start from "./elements/Start";
import { getStore, setStore, getProject } from "../../data/dataStore";
import { getSequence } from "../../data/getData";
import runSequenceEvents from "./general/runSequenceEvents";
import handleSelectNode from "./selecting/handleSelectNode";
import positionNodes from "./linking/positionNodes";
import drawArrows from "./linking/drawArrows";
import bindNodeDropZones from "./dragging/bindNodeDropZones";
import setSequenceHeight from "./general/setSequenceHeight";

/**
 * A sequence contains a series of nodes (cells and branches), and arranges them in the order they are linked. The sequence also houses a number of events related to adding and deleting nodes, which can be found in runSequenceEvents.
 *
 * @param {string} id - The id of the sequence.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function Sequence(props: {
  id: string;
  setProjectData: Function;
}) {
  const projectData = getProject();
  // Set up selection
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  ("");
  // Listeners for arrows
  const arrowsRef = useRef(null);
  const svgRef = useRef(null);
  // On mount...
  useEffect(() => {
    // Run sequence events
    runSequenceEvents({
      id: props.id,
      setProjectData: props.setProjectData,
    });
  }, []);
  // On each refresh...
  useEffect(() => {
    // Draw arrows
    if (arrowsRef.current && svgRef.current) {
      drawArrows(arrowsRef.current, svgRef.current);
    }
    // Bind drop zones
    bindNodeDropZones(props.setProjectData);
    // Set height of sequence
    setSequenceHeight();
  });
  // Get sequence
  const positionedData = positionNodes(props.id);
  const sequence: any = getSequence(props.id, positionedData);
  // Get nodes in sequence
  const nodes = sequence.nodes;
  const nodeEls: React.ReactElement[] = [];
  nodes.forEach((node: any) => {
    const nodeProps = {
      key: node.id,
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      top: node.position.top,
      left: node.position.left,
      width: node.position.width,
      height: node.position.height,
      setProjectData: props.setProjectData,
      onClick: () => {
        handleSelectNode(node, setSelectedNodes);
      },
    };
    let nodeEl: any;
    if (node.type === "cell") {
      nodeEl = <Cell {...nodeProps} />;
    } else if (node.type === "branch") {
      nodeEl = <Branch {...nodeProps} />;
    } else if (node.type === "start") {
      nodeEl = <Start {...nodeProps} />;
    }
    nodeEls.push(nodeEl);
  });
  return (
    <div id="sequence" key={props.id}>
      <ul className="nodes" ref={arrowsRef}>
        {nodeEls}
      </ul>
      <svg id="arrows" ref={svgRef}></svg>
      <div id="selection-area"></div>
    </div>
  );
}
