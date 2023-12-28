import { Stem, Branch, Store } from "../../../typings";
import { getStore, setStore } from "../../../data/dataStore";

export default function StemInstance(props: {
  stem: Stem;
  branch: Branch;
  store: Store;
  update: Function;
  indexLabel: Number;
}) {
  const stemLabel = `Stem ${props.indexLabel}`;
  const store = getStore();
  let selectedClass = "";
  const stemInStore = store.selectedStem;
  if (stemInStore !== false) {
    if (stemInStore.id === props.stem.id) {
      selectedClass = "selected";
    }
  }
  const itemClass = `inspector-item branch-stem ${selectedClass}`;
  return (
    <div class={itemClass}>
      <div class="item-toolbar">
        <h5 class="item-heading aria-only">{stemLabel}</h5>
        <div class="stem-index">{props.indexLabel}</div>
      </div>
      <p class="match-text">
        <span>Match </span>
        <select>
          <option>all</option>
          <option>any</option>
        </select>
        <span> of the following rules:</span>
        <button>Add Rule</button>
      </p>
    </div>
  );
}
