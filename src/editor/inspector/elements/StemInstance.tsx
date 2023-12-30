import { Stem, Branch, Rule, Store } from "../../../typings";
import { getBranchStem } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import addRule from "../functions/addRule";
import RuleInstance from "./RuleInstance";

export default function StemInstance(props: {
  stem: Stem;
  branch: Branch;
  store: Store;
  update: Function;
  indexLabel: Number;
}) {
  // Functions
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
  // Front-end elements
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
    <select
      class="match-dropdown"
      value={props.stem.match}
      onChange={handleMatchChange}
    >
      <option value="all">all</option>
      <option value="any">any</option>
    </select>
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
  props.stem.rules.forEach((rule: Rule) => {
    const key = `rule_${rule.id}`;
    const ruleEl = (
      <RuleInstance
        key={key}
        rule={rule}
        stem={props.stem}
        branch={props.branch}
        update={props.update}
      />
    );
    ruleEls.push(ruleEl);
  });
  // Return
  return (
    <div class={itemClass}>
      <div class="item-toolbar">
        <h5 class="item-heading aria-only">{stemLabel}</h5>
        <div class="stem-index">{props.indexLabel}</div>
        <p class="match-text">{matchText}</p>
        <div class="controls">
          <button
            class="add-rule icon"
            title="Add Rule"
            onClick={handleAddRule}
          >
            <span class="icon">
              <i class="bi bi-plus-circle-fill"></i>
            </span>
          </button>
        </div>
      </div>
      <ul class="rules">{ruleEls}</ul>
    </div>
  );
}
