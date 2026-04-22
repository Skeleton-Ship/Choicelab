import { isNaN } from "lodash";
import { TargetedEvent } from "preact/compat";

export function FontSizeDropdown(props: {
  initial: string;
  update: (value: string) => void;
}) {
  let customSize =
    props.initial !== "var(--font-size-xs)" &&
    props.initial !== "var(--font-size-sm)" &&
    props.initial !== "var(--font-size-md)" &&
    props.initial !== "var(--font-size-lg)" &&
    props.initial !== "var(--font-size-xl)"
      ? true
      : false;
  function handleChange(e: TargetedEvent, custom?: boolean) {
    const target = e.target as HTMLInputElement;
    let value = target.value;
    if (custom === true) {
      let valueInt = parseInt(value);
      if (!isNaN(valueInt)) {
        if (valueInt > 244) valueInt = 244;
        if (valueInt < 1) valueInt = 1;
        value = valueInt.toString();
      } else {
        value = "12";
      }
    }
    props.update(value);
  }
  return (
    <div class="font-size-selector">
      <label>Size:</label>
      <div class="ui-dropdown">
        <select class="font-size" onChange={handleChange}>
          <option
            value="var(--font-size-xs)"
            selected={props.initial === "var(--font-size-xs)" ? true : false}
          >
            Extra Small
          </option>

          <option
            value="var(--font-size-sm)"
            selected={props.initial === "var(--font-size-sm)" ? true : false}
          >
            Small
          </option>
          <option
            value="var(--font-size-md)"
            selected={props.initial === "var(--font-size-md)" ? true : false}
          >
            Medium
          </option>
          <option
            value="var(--font-size-lg)"
            selected={props.initial === "var(--font-size-lg)" ? true : false}
          >
            Large
          </option>
          <option
            value="var(--font-size-xl)"
            selected={props.initial === "var(--font-size-xl)" ? true : false}
          >
            Extra Large
          </option>
          <option value="" selected={customSize}>
            Custom
          </option>
        </select>
      </div>
      {customSize ? (
        <>
          <input
            type="text"
            class="ui-text-field"
            value={props.initial}
            onChange={(e) => {
              handleChange(e, true);
            }}
          />
          <span>px</span>
        </>
      ) : null}
    </div>
  );
}
