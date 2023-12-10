import { getNode } from "../../../data/getData";
import { getStore } from "../../../data/dataStore";
import Link from "./Link";
import { AnyNode } from "../../../typings";

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
}): JSX.Element {
  const store = getStore();
  const cell: AnyNode | undefined = getNode(props.id, store);
  const defaultEl = <div>No start found</div>;
  if (typeof cell === "undefined") {
    return defaultEl;
  }
  if (typeof cell.link === "undefined") {
    return defaultEl;
  }
  return (
    <li
      className="start node"
      data-id={props.id}
      data-element="start"
      data-link-to={cell.link.to}
    >
      <div className="contents">
        <span className="node-id">{props.id}</span>
        <div className="title">Start</div>
      </div>
      <Link origin="cell" nodeId={props.id} update={props.update} />
    </li>
  );
}
