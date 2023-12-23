import { getCell } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import isNodeSelected from "../selecting/isNodeSelected";
import Link from "./Link";
import { Cell } from "../../../typings";

/**
 * A node that supports actions, in which the content of the Choicelab sequence lives.
 */
export default function CellEl(props: {
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
  const cell: Cell | undefined = getCell(props.id, store);
  const defaultEl = <div>No cell found</div>;
  if (typeof cell === "undefined") {
    return defaultEl;
  }
  function handleSelectCell() {
    const store = getStore();
    store.selectedStem = false;
    setStore(store);
    props.onClick(cell);
  }
  const selectedNodes = store.selectedNodes;
  const selectedClass = isNodeSelected(props.id, selectedNodes)
    ? "selected"
    : "";
  const cellClass = `cell node ${selectedClass}`;
  const style = {
    top: props.top + "px",
    left: props.left + "px",
    width: props.width + "px",
    height: props.height + "px",
  };
  // TEMP: Show action names
  let actionsText = "";
  cell.actions.forEach((action) => {
    actionsText += action.name + " ";
  });
  return (
    <li
      className={cellClass}
      data-id={props.id}
      data-element="cell"
      data-link-to={cell.link.to}
      data-position-x={props.x}
      data-position-y={props.y}
      onClick={handleSelectCell}
      style={style}
    >
      <div className="contents">
        <div className="title">{props.id}</div>
        <div className="actions">{actionsText}</div>
      </div>
      <Link origin="cell" nodeId={props.id} update={props.update} />
    </li>
  );
}
