import Link from "./Link";
import { getBranchStem } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import { Stem } from "../../../typings";

/**
 * A single path in a branch. If the stem is a "value" type, it will test for the given value. A "noMatch" type stem is the fallback if all other stems fail.
 *
 */
export default function BranchStemEl(props: {
  id: string;
  index: number;
  nodeId: string;
  onClick: Function;
  update: Function;
}) {
  function handleSelectStem() {
    const store = getStore();
    const branchStem: Stem | undefined = getBranchStem(
      props.id,
      props.nodeId,
      store
    );
    if (typeof branchStem === "undefined") return;
    store.selectedStem = branchStem;
    setStore(store);
    props.onClick(branchStem);
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
        No Match
        {link}
      </>
    );
  } else if (stem.type === "rules") {
    contents = (
      <>
        <span className="node-id">{stem.id}</span>
        <span class="stem-index">{props.index}</span>
        {link}
      </>
    );
  }
  // Styles
  const viewSettings = store.viewSettings;
  const style = {
    left: viewSettings.stemMarginLeft * props.index + "px",
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
