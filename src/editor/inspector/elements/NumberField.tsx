import { createRef } from "preact";
import { parseNumber } from "../../../utils/parseNumber";

export default function NumberField(props: {
  name: string;
  value: any;
  class?: string;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  showSpinner?: boolean;
  onChange: Function;
}) {
  let supplementalClass = props.class || "";
  const ref = createRef();
  const className = `ui-number-field ${
    !props.showSpinner ? "no-spinner" : ""
  } ${supplementalClass}`;
  function doSpinner(amount: number) {
    const el = ref.current;
    const value = parseNumber(el.value);
    const newValue = value + amount;
    el.value = newValue;
    ref.current.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return (
    <div class={className}>
      <input
        name={props.name}
        type="number"
        ref={ref}
        min={props.min ? props.min : undefined}
        max={props.max ? props.max : undefined}
        step={props.step ? props.step : 1}
        value={props.value}
        onChange={(e) => {
          const field = e.target as HTMLInputElement;
          const value = field.value;
          const limit = props.decimalPlaces ? props.decimalPlaces : 2;
          let number = parseNumber(value, limit);
          if (typeof props.min !== "undefined" && number < props.min) {
            number = props.min;
          }
          if (typeof props.max !== "undefined" && number > props.max)
            number = props.max;
          props.onChange(number);
        }}
      />

      {props.showSpinner && props.showSpinner === true ? (
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
      ) : (
        <></>
      )}
    </div>
  );
}
