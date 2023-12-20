import { getStore, setStore } from "../../data/dataStore";
import setSequenceDimensions from "./general/setSequenceDimensions";
import IconSlider from "../../assets/icon-slider.svg";

export default function ViewSlider(props: { update: Function }) {
  const store = getStore();
  const viewSettings = store.viewSettings;
  function setView(target: EventTarget | null) {
    if (target === null) return;
    const value = (target as HTMLInputElement).value;
    const store = getStore();
    const valueNum = parseInt(value);
    const viewSettings = store.viewSettings;
    // Set width
    viewSettings.cellWidth = valueNum;
    viewSettings.cellMarginLeft = valueNum + valueNum * 0.22;
    // Set height
    const heightNum = valueNum * 0.7;
    viewSettings.cellHeight = heightNum;
    viewSettings.cellMarginTop = heightNum + valueNum;
    if (viewSettings.cellMarginTop > 500) viewSettings.cellMarginTop = 500;
    // Set stem size
    viewSettings.stemMarginLeft = viewSettings.cellWidth + 15;
    setSequenceDimensions();
    setStore(store);
    props.update(false);
  }
  return (
    <div id="view-slider">
      <img src={IconSlider} />
      <input
        type="range"
        id="cell-width"
        name="cell-width"
        value={viewSettings.cellWidth}
        min="105"
        max="500"
        onInput={(e) => {
          setView(e.target);
        }}
      />
    </div>
  );
}
