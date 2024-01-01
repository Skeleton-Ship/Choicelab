import { getNode } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import Link from "./Link";
import { AnyNode } from "../../../typings";
import isNodeSelected from "../selecting/isNodeSelected";

/**
 * A node that represents the start point of the sequence. Only its link can be set; it otherwise cannot be changed, moved, or deleted.
 *
 */
export default function StartEl(props: {
  id: string;
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
  update: Function;
  onClick: Function;
}) {
  const store = getStore();
  const cell: AnyNode | undefined = getNode(props.id, store);
  const defaultEl = <div>No start found</div>;
  if (typeof cell === "undefined") {
    return defaultEl;
  }
  if (typeof cell.link === "undefined") {
    return defaultEl;
  }
  function handleSelectStart() {
    const store = getStore();
    store.selectedStem = false;
    setStore(store);
    props.onClick(cell);
  }
  const selectedNodes = store.selectedNodes;
  const selectedClass = isNodeSelected(props.id, selectedNodes)
    ? "selected"
    : "";
  const targetModeClass =
    store.targetMode.nodeId === props.id ? "target-mode-origin" : "";
  const cellClass = `start node ${selectedClass} ${targetModeClass}`;
  const style = {
    top: props.top + "px",
    left: props.left + "px",
    width: props.width + "px",
    height: props.height + "px",
  };
  return (
    <li
      className={cellClass}
      data-id={props.id}
      data-element="start"
      data-link-to={cell.link.to}
      data-position-x={props.x}
      data-position-y={props.y}
      style={style}
      onClick={handleSelectStart}
    >
      <div className="contents">
        <span className="node-id">{props.id}</span>
        <div className="title">Start</div>
      </div>
      <Link origin="cell" nodeId={props.id} update={props.update} />
    </li>
  );
}
