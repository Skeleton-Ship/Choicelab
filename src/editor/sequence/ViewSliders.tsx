import { getStore, setStore } from "../../data/dataStore";
import setSequenceDimensions from "./general/setSequenceDimensions";
import IconSliderHorizontal from "../../assets/icon-slider-horizontal.svg";
import IconSliderVertical from "../../assets/icon-slider-vertical.svg";

export default function ViewSliders(props: { update: Function }) {
  const store = getStore();
  const viewSettings = store.viewSettings;
  function setView(target: EventTarget | null, prop: string) {
    if (target === null) return;
    const value = (target as HTMLInputElement).value;
    const store = getStore();
    const valueNum = parseInt(value);
    const viewSettings = store.viewSettings;
    if (prop === "width") {
      viewSettings.cellWidth = valueNum;
      viewSettings.cellMarginLeft = valueNum + valueNum * 0.22;
    } else if (prop === "height") {
      viewSettings.cellHeight = valueNum;
      viewSettings.cellMarginTop = valueNum + valueNum * 1.75;
      if (viewSettings.cellMarginTop > 600) viewSettings.cellMarginTop = 600;
    }
    setStore(store);
    setSequenceDimensions();
    props.update(false);
  }
  return (
    <div id="view-sliders">
      <img src={IconSliderHorizontal} />
      <input
        type="range"
        id="cell-width"
        name="cell-width"
        value={viewSettings.cellWidth}
        class="view-slider"
        min="150"
        max="600"
        onInput={(e) => {
          setView(e.target, "width");
        }}
      />
      <img src={IconSliderVertical} />
      <input
        type="range"
        id="cell-height"
        name="cell-width"
        value={viewSettings.cellHeight}
        class="view-slider"
        min="80"
        max="400"
        onInput={(e) => {
          setView(e.target, "height");
        }}
      />
    </div>
  );
}
