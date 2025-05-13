import { round } from "lodash";

export function parseNumber(
  value: string | number,
  limit: number = 10
): number {
  let newValue: string | number = value;
  if (typeof newValue === "number") newValue = newValue.toString();
  newValue = newValue.replace(/[^0-9\-.]/g, "");
  if (newValue.endsWith(".")) {
    newValue += "0";
  }
  if (newValue === "") {
    newValue = "0";
  }
  /*
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
  */
  newValue = parseFloat(newValue);
  if (!isNaN(newValue)) {
    newValue = round(newValue, limit);
  } else {
    newValue = 0;
  }
  return newValue;
}
