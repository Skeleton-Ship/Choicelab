import { isNaN } from "lodash";
import { TargetedEvent } from "preact/compat";

export function FontSizeDropdown(props: {
  initial: string;
  update: (value: string) => void;
}) {
  let customSize =
    props.initial !== "var(--font-size-small)" &&
    props.initial !== "var(--font-size-medium)" &&
    props.initial !== "var(--font-size-large)"
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
      <div class="ui-dropdown">
        <label class="sr-only">Font Size:</label>
        <select class="font-size" onChange={handleChange}>
          <option
            value="var(--font-size-small)"
            selected={props.initial === "var(--font-size-small)" ? true : false}
          >
            Small Size
          </option>
          <option
            value="var(--font-size-medium)"
            selected={
              props.initial === "var(--font-size-medium)" ? true : false
            }
          >
            Medium Size
          </option>
          <option
            value="var(--font-size-large)"
            selected={props.initial === "var(--font-size-large)" ? true : false}
          >
            Large Size
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
