import { getStore, setStore } from "../../data/dataStore";
import setSequenceDimensions from "./general/setSequenceDimensions";
import setViewSettings from "../../utils/setViewSettings";
import IconSlider from "../../assets/icon-slider.svg";

export default function ViewSlider(props: { update: Function }) {
  const store = getStore();
  const viewSettings = store.viewSettings;
  function setView(target: EventTarget | null) {
    if (target === null) return;
    const value = (target as HTMLInputElement).value;
    const store = getStore();
    const valueNum = parseInt(value);
    store.viewSettings = setViewSettings(valueNum, store);
    setSequenceDimensions();
    setStore(store);
    props.update(false);
  }
  return (
    <div id="view-slider" tabindex={-1}>
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
