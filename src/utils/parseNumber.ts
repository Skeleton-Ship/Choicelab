import { round } from "lodash";

/*
 * Utility for rounding numbers and converting number-like strings into actual numbers
 */
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
  newValue = parseFloat(newValue);
  if (!isNaN(newValue)) {
    newValue = round(newValue, limit);
  } else {
    newValue = 0;
  }
  return newValue;
}
