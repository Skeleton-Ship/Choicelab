import { Stem, Branch, Rule, Store } from "../../../typings";
import { getBranchStem, getVariables } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import addRule from "../functions/addRule";
import showPane from "../functions/showPane";
import RuleInstance from "./RuleInstance";

export default function StemInstance(props: {
  stem: Stem;
  branch: Branch;
  store: Store;
  update: Function;
  indexLabel: Number;
}) {
  /*
   * Functions
   */
  function handleAddRule() {
    addRule(props.stem.id, props.branch.id, props.update);
  }
  function handleMatchChange(e: Event) {
    let target;
    if (e.target !== null) {
      target = e.target as Element;
    }
    if (!target) return;
    const value = (target as HTMLInputElement).value;
    const store = getStore();
    const stem = getBranchStem(props.stem.id, props.branch.id, store);
    if (!stem) {
      console.error("Stem not found.");
      return;
    }
    stem.match = value;
    setStore(store);
    props.update();
  }

  /*
   * Elements
   */
  const stemLabel = `Stem ${props.indexLabel}`;
  const store = getStore();
  let selectedClass = "";
  const stemInStore = store.selectedStem;
  if (stemInStore !== false) {
    if (stemInStore.id === props.stem.id) {
      selectedClass = "selected";
    }
  }
  const matchDropdown = (
    <div class="ui-dropdown">
      <select
        class="match-dropdown"
        value={props.stem.match}
        onChange={handleMatchChange}
      >
        <option value="all">all</option>
        <option value="any">any</option>
      </select>
    </div>
  );
  let matchText = <span>Match this rule:</span>;
  if (props.stem.rules.length > 1) {
    matchText = (
      <>
        <span>Match </span>
        {matchDropdown}
        <span> of these rules:</span>
      </>
    );
  }
  const itemClass = `inspector-item branch-stem ${selectedClass}`;
  const ruleEls: Array<preact.JSX.Element> = [];
  let ruleIndex = 0;
  props.stem.rules.forEach((rule: Rule) => {
    const key = `rule_${rule.id}`;
    const ruleEl = (
      <RuleInstance
        key={key}
        rule={rule}
        stem={props.stem}
        branch={props.branch}
        index={ruleIndex}
        update={props.update}
      />
    );
    ruleEls.push(ruleEl);
    ruleIndex++;
  });
  const stemIndex =
    props.branch.stems.length > 2 ? (
      <div class="stem-index">{props.indexLabel}</div>
    ) : (
      ""
    );
  // Finally, test if we have any variables, and show a placeholder if so
  let mainContents = <ul class="rules">{ruleEls}</ul>;
  let toolbarItems = (
    <>
      <p class="match-text">{matchText}</p>
      <div class="controls">
        <button class="add-rule icon" title="Add Rule" onClick={handleAddRule}>
          <span class="icon">
            <i class="bi bi-plus-circle-fill"></i>
          </span>
        </button>
      </div>
    </>
  );
  const variables = getVariables(props.store);
  if (variables.length === 0) {
    toolbarItems = <></>;
    mainContents = (
      <p class="blank-content">
        <button
          class="ui-button"
          onClick={() => {
            showPane("variables", props.update);
          }}
        >
          Create a variable
        </button>{" "}
        to add rules for this branch.
      </p>
    );
  }
  const toolbarContents = (
    <div class="item-toolbar">
      {stemIndex}
      <h5 class="item-heading aria-only">{stemLabel}</h5>
      {toolbarItems}
    </div>
  );
  // Return
  return (
    <div class={itemClass}>
      {toolbarContents}
      {mainContents}
    </div>
  );
}
