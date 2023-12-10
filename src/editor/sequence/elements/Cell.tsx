import { useState } from "react";
import { getNode } from "../../../data/getData";
import { getStore, setStore, getProject } from "../../../data/dataStore";
import isNodeSelected from "../selecting/isNodeSelected";
import Label from "./Label";
import Link from "./Link";

/**
 * A node that supports actions, in which the content of the Choicelab sequence lives.
 *
 * @param {string} id - The ID of the cell.
 * @param {Function} onClick - A React handler when the cell is clicked. Selects the cell.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function Cell(props: {
  id: string;
  setProjectData: Function;
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
  onClick: Function;
}) {
  const projectData = getProject();
  const cell: any = getNode(props.id, projectData);
  const [previousLabelValue, setPreviousLabelValue] = useState("");
  function handleSelectCell() {
    setStore({
      selectedStem: false,
    });
    props.onClick(getNode(props.id, projectData));
  }
  const selectedNodes = getStore("selectedNodes");
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
      draggable
    >
      <div className="contents">
        <span className="node-id">{props.id}</span>
        <div className="title">
          <Label
            text={cell.label}
            nodeId={props.id}
            setProjectData={props.setProjectData}
          />
        </div>
      </div>
      <Link
        origin="cell"
        nodeId={props.id}
        setProjectData={props.setProjectData}
      />
    </li>
  );
}
