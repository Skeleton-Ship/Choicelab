import { getCell } from "../../../data/getData";
import { getStore, getViewStore } from "../../../data/dataStore";
import isNodeSelected from "../selecting/isNodeSelected";
import Link from "./Link";
import { Cell, Action } from "../../../typings";
import internalActionDefs from "../../inspector/functions/internalActionDefs";
import { getActionDef } from "../../../data/getData";
import handleSelectNode from "../selecting/handleSelectNode";

/**
 * A node that supports actions, in which the content of the Choicelab sequence lives.
 */
export default function CellEl(props: {
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
  const cell: Cell | undefined = getCell(props.id, store);
  const defaultEl = <div>No cell found</div>;
  if (typeof cell === "undefined") {
    return defaultEl;
  }
  const selectedNodes = viewStore.selectedNodes;
  const selectedClass = isNodeSelected(props.id, selectedNodes)
    ? "selected"
    : "";
  const targetModeClass =
    viewStore.targetMode.nodeId === props.id ? "target-mode-origin" : "";
  const cellClass = `cell node ${selectedClass} ${targetModeClass}`;
  const style = {
    top: props.top + "px",
    left: props.left + "px",
    ...(props.width !== undefined && { width: props.width + "px" }),
    ...(props.height !== undefined && { height: props.height + "px" }),
  };
  // Show action elements
  const actionEls: Array<preact.JSX.Element> = [];
  cell.actions.forEach((action: Action) => {
    let actionContents = <></>,
      actionClass = "action";
    const actionDef = getActionDef(action.name, internalActionDefs);
    if (!actionDef) return;
    actionClass = actionClass + ` ${actionDef.name}`;
    if (!actionDef.flowchart) {
      actionClass = actionClass + " no-props";
      actionContents = <span class="action-name">{actionDef.label}</span>;
    } else {
      const FCElement = actionDef.flowchart;
      actionContents = <FCElement {...action.props} />;
    }
    const elKey = `action_${action.id}`;
    const actionEl = (
      <li key={elKey} class={actionClass} data-action={actionDef.name}>
        {actionContents}
      </li>
    );
    actionEls.push(actionEl);
  });
  return (
    <li
      className={cellClass}
      data-id={props.id}
      data-element="cell"
      data-link-to={cell.link.to}
      data-position-x={props.x}
      data-position-y={props.y}
      onClick={() => {
        handleSelectNode(cell, props.update);
      }}
      style={style}
    >
      <div className="contents">
        <div className="title">{props.id}</div>
        <ul className="actions">{actionEls}</ul>
      </div>
      <Link origin="cell" nodeId={props.id} update={props.update} />
    </li>
  );
}
