import { RichText, RichTextInline, VariableValue } from "./schema/project";
import { getStore } from "./store";

/*
 * Renders rich text (a Portable Text subset; see src/player/src/schema/project.ts) with
 * the current values of any variables in it. Values are read once, when the
 * action renders. Everything is added as text nodes, never as HTML, so a value
 * a viewer typed can't add markup.
 */

export function formatVariableValue(value: VariableValue | undefined): string {
  if (value === undefined) return "";
  // Unset numbers show nothing
  if (typeof value === "number") return Number.isNaN(value) ? "" : String(value);
  return String(value);
}

function getVariableText(variableId: string): string {
  const variable = getStore().playback.variables.items.find((v) => v.id === variableId);
  return formatVariableValue(variable?.value);
}

function getInlineText(child: RichTextInline): string {
  return child._type === "span" ? child.text : getVariableText(child.variableId);
}

/** Appends a paragraph's contents to an element, with <br> for line breaks. */
export function appendRichTextBlock(el: HTMLElement, children: RichTextInline[]) {
  const text = children.map(getInlineText).join("");
  text.split("\n").forEach((line, i) => {
    if (i > 0) el.appendChild(document.createElement("br"));
    if (line !== "") el.appendChild(document.createTextNode(line));
  });
}

/** Rich text as a single string, for labels and attributes. */
export function richTextToString(richText: RichText): string {
  return richText
    .map((block) => block.children.map(getInlineText).join(""))
    .join(" ")
    .replace(/\s*\n\s*/g, " ");
}
