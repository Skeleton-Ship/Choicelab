import { createRef } from "preact";

function parseNumber(value: string, limit: number = 2): number {
  let newValue: string | number = value;
  newValue = newValue.replace(/[^0-9\-.]/g, "");
  if (newValue.endsWith(".")) {
    newValue += "0";
  }
  if (newValue === "") {
    newValue = "0";
  }
  // Check for the last occurrence of a period
  const lastDotIndex = newValue.lastIndexOf(".");

  // If there is a period, check the number of digits after it
  if (lastDotIndex !== -1) {
    const integerPart = newValue.substring(0, lastDotIndex + 1);
    let decimalPart = newValue.substring(lastDotIndex + 1);

    // If more than x decimal places, truncate to x
    if (decimalPart.length > limit) {
      decimalPart = decimalPart.substring(0, limit);
    }

    newValue = integerPart + decimalPart;
  }
  newValue = parseFloat(newValue);
  if (isNaN(newValue)) {
    newValue = 0;
  }
  return newValue;
}

export default function NumberField(props: {
  name: string;
  value: any;
  class?: string;
  step?: number;
  decimalPlaces?: number;
  onChange: Function;
}) {
  let supplementalClass = props.class || "";
  const ref = createRef();
  const className = `ui-number-field ${supplementalClass}`;
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
        step={props.step ? props.step : 1}
        value={props.value}
        onChange={(e) => {
          const field = e.target as HTMLInputElement;
          const value = field.value;
          const limit = props.decimalPlaces ? props.decimalPlaces : 2;
          const number = parseNumber(value, limit);
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
