import Label from "./Label";
import Link from "./Link";
import { getBranchStem } from "../../../data/getData";
import { getStore, setStore, getProject } from "../../../data/dataStore";

/**
 * A single path in a branch. If the stem is a "value" type, it will test for the given value. A "noMatch" type stem is the fallback if all other stems fail.
 *
 * @param {string} id - The ID of the branch stem.
 * @param {string} nodeId - The ID of the parent branch.
 * @param {Function} onClick - A React handler when the stem is clicked. Selects the stem.
 * @param {Function} setProjectData - A React handler that traverses back to the app root, triggering a refresh.
 */
export default function BranchStem(props: {
  id: string;
  index: number;
  nodeId: string;
  onClick: Function;
  setProjectData: Function;
}) {
  function handleSelectStem() {
    const projectData = getProject();
    const branchStem = getBranchStem(props.id, props.nodeId, projectData);
    setStore({ selectedStem: branchStem });
    props.onClick(branchStem);
  }

  const projectData = getProject();
  const selectedStem = getStore("selectedStem");
  let selectedClass = "";
  if (selectedStem !== false) {
    if (selectedStem.id === props.id) {
      selectedClass = "selected";
    }
  }
  const stem: any = getBranchStem(props.id, props.nodeId, projectData);
  let contents;
  let link = (
    <Link
      origin="branchStem"
      nodeId={props.nodeId}
      stemId={props.id}
      setProjectData={props.setProjectData}
    />
  );
  if (stem.type === "noMatch") {
    contents = (
      <>
        <span className="node-id">{stem.id}</span>
        No Match
        {link}
      </>
    );
  }
  if (stem.type === "value") {
    contents = (
      <>
        <span className="node-id">{stem.id}</span>
        <span>=&nbsp;</span>
        <Label
          text={stem.value}
          nodeId={props.nodeId}
          stemId={props.id}
          placeholder="value"
          textProp="value"
          setProjectData={props.setProjectData}
        />
        {link}
      </>
    );
  }
  // Styles
  const style = {
    left: 275 * props.index + "px",
    top: 100 + "px",
  };
  return (
    <li
      className={`stem ${selectedClass}`}
      data-id={props.id}
      data-element="branchStem"
      data-branch={props.nodeId}
      data-link-to={stem.link.to}
      onClick={handleSelectStem}
      style={style}
    >
      {contents}
    </li>
  );
}
