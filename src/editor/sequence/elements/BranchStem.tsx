import Link from "./Link";
import { getBranch, getBranchStem } from "../../../data/getData";
import { getStore } from "../../../data/dataStore";
import { Branch, Stem } from "../../../typings";
import getStemRulesLabel from "../general/getStemRulesLabel";
import handleSelectNode from "../selecting/handleSelectNode";

/**
 * A single path in a branch. If the stem is a "value" type, it will test for the given value. A "noMatch" type stem is the fallback if all other stems fail.
 *
 */
export default function BranchStemEl(props: {
  id: string;
  index: number;
  nodeId: string;
  update: Function;
}) {
  function handleSelectStem() {
    const store = getStore();
    const branch = getBranch(props.nodeId, store);
    const branchStem: Stem | undefined = getBranchStem(
      props.id,
      props.nodeId,
      store
    );
    if (!branch || !branchStem) return;
    handleSelectNode(branch, props.update, branchStem);
  }
  const store = getStore();
  const selectedStem = store.selectedStem;
  let selectedClass = "";
  if (selectedStem !== false) {
    if (selectedStem.id === props.id) {
      selectedClass = "selected";
    }
  }
  const stem: Stem | undefined = getBranchStem(props.id, props.nodeId, store);
  if (typeof stem === "undefined") return <></>;
  let contents;
  let stemIndex;
  let link = (
    <Link
      origin="branchStem"
      nodeId={props.nodeId}
      stemId={props.id}
      update={props.update}
    />
  );
  if (stem.type === "noMatch") {
    contents = (
      <>
        <span className="node-id">{stem.id}</span>
        <span class="no-match-index">
          <i class="bi bi-x"></i>
        </span>
        <span class="stem-label">No Match</span>
        {link}
      </>
    );
  } else if (stem.type === "rules") {
    const stemLabel = getStemRulesLabel(stem);
    const branch: Branch | undefined = getBranch(props.nodeId, store);
    if (branch) {
      stemIndex =
        branch.stems.length > 2 ? (
          <span class="stem-index">{props.index + 1}</span>
        ) : (
          ""
        );
    }
    contents = (
      <>
        <span className="node-id">{stem.id}</span>
        {stemIndex}
        <span class="stem-label">{stemLabel}</span>
        {link}
      </>
    );
  }
  // Styles
  const viewSettings = store.viewSettings;
  const style = {
    left: viewSettings.stemMarginLeft * props.index + "px",
    top: 100 + "px",
    width: viewSettings.stemWidth + "px",
    height: viewSettings.stemHeight + "px",
  };
  const className = `stem ${stem.type} ${selectedClass}`;
  return (
    <li
      className={className}
      data-id={props.id}
      data-index={props.index}
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
