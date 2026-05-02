import { useState, useRef } from "preact/hooks";
import { parseNumber } from "../../../utils/parseNumber";

/*
 * Generic number field, used across the editor
 */
export default function NumberField(props: {
  name: string;
  value: any;
  class?: string;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  onChange: Function;
}) {
  let supplementalClass = props.class || "";
  const elRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(String(props.value));
  const className = `ui-number-field ${supplementalClass}`;
  function doSpinner(amount: number) {
    if (elRef.current === null) return;
    const el = elRef.current as HTMLInputElement;
    const rawValue = parseNumber(el.value, props.decimalPlaces);
    let newValue = parseNumber(rawValue + amount, props.decimalPlaces);
    if (typeof props.min !== "undefined" && newValue < props.min) {
      newValue = props.min;
    }
    if (typeof props.max !== "undefined" && newValue > props.max)
      newValue = props.max;
    //
    // TODO: Does using both setValue and dispatchEvent create duplicative setting of data?
    //
    el.dispatchEvent(new Event("input", { bubbles: true }));
    setDisplayValue(String(newValue));
    props.onChange(newValue);
  }
  return (
    <div class={className}>
      <input
        name={props.name}
        type="text"
        ref={elRef}
        min={props.min ? props.min : undefined}
        max={props.max ? props.max : undefined}
        step={props.step ? props.step : 1}
        value={displayValue}
        onChange={(e) => {
          const field = e.target as HTMLInputElement;
          const raw = field.value;
          setDisplayValue(raw);
          if (raw.endsWith(".") || raw === "-" || raw === "") return;
          const limit = props.decimalPlaces ? props.decimalPlaces : 2;
          let number = parseNumber(raw, limit);
          if (typeof props.min !== "undefined" && number < props.min) number = props.min;
          if (typeof props.max !== "undefined" && number > props.max) number = props.max;
          props.onChange(number);
        }}
        onBlur={() => {
          const limit = props.decimalPlaces ? props.decimalPlaces : 2;
          let number = parseNumber(displayValue, limit);
          if (typeof props.min !== "undefined" && number < props.min) number = props.min;
          if (typeof props.max !== "undefined" && number > props.max) number = props.max;
          setDisplayValue(String(number));
          props.onChange(number);
        }}
      />
      <div class="controls">
        <button
          onClick={() => {
            doSpinner(props.step ? props.step : 1);
          }}
        >
          <svg
            width="50"
            height="30"
            viewBox="0 0 50 30"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              id="Path-copy"
              fill="none"
              stroke="#000000"
              stroke-width="10"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M 45 25 L 25 5"
            />
            <path
              id="Shape-copy-5"
              fill="none"
              stroke="#000000"
              stroke-width="10"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M 5 25 L 25 5"
            />
          </svg>
        </button>
        <button
          onClick={() => {
            doSpinner(props.step ? props.step * -1 : -1);
          }}
        >
          <svg
            width="50"
            height="30"
            viewBox="0 0 50 30"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              id="Shape-copy-4"
              fill="none"
              stroke="#000000"
              stroke-width="10"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M 45 5 L 25 25"
            />
            <path
              id="Shape-copy-3"
              fill="none"
              stroke="#000000"
              stroke-width="10"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M 5 5 L 25 25"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
