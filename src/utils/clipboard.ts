import { stringify } from "./stringify";
import isJson from "./isJson";

/**
 * Writes an object to the clipboard as JSON text.
 *
 * @param {object} contents - The object to write, keyed by what it holds (e.g. `ChoicelabNodes`).
 */
export function writeClipboardJson(contents: object) {
  const type = "text/plain";
  const blob = new Blob([stringify(contents)], { type });
  navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
}

/**
 * Reads the clipboard, returning its contents as an object if they're JSON, or
 * null otherwise.
 */
export async function readClipboardJson(): Promise<Record<string, unknown> | null> {
  const clipText = await navigator.clipboard.readText();
  if (!isJson(clipText)) return null;
  const data: unknown = JSON.parse(clipText);
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}
