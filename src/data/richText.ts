import { v4 as uuidv4 } from "uuid";
import {
  ActionPropValue,
  RichText,
  RichTextBlock,
  RichTextInline,
  Variable,
} from "../typings";

/*
 * Helpers for rich text (a Portable Text subset; see src/player/src/schema/project.ts).
 * Pure functions with no editor dependencies.
 */

export function createRichTextKey(): string {
  return uuidv4().replace(/-/g, "").slice(0, 12);
}

export function createRichTextBlock(children: RichTextInline[]): RichTextBlock {
  return {
    _type: "block",
    _key: createRichTextKey(),
    style: "normal",
    markDefs: [],
    children,
  };
}

export function isRichText(value: ActionPropValue | undefined): value is RichText {
  return Array.isArray(value);
}

/**
 * Converts plain text to rich text. Blank lines separate paragraphs; single
 * line breaks stay line breaks within a paragraph, so the text looks the same.
 */
export function richTextFromPlainText(text: string): RichText {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (normalized === "") return [];
  return normalized
    .split(/\n[ \t]*\n\s*/)
    .map((paragraph) =>
      createRichTextBlock([
        { _type: "span", _key: createRichTextKey(), text: paragraph, marks: [] },
      ])
    );
}

/**
 * Flattens rich text to plain text, with a blank line between paragraphs.
 * @param renderVariable - Returns the text to show for a variable reference.
 */
export function richTextToPlainText(
  richText: RichText,
  renderVariable: (variableId: string) => string,
  paragraphSeparator = "\n\n"
): string {
  return richText
    .map((block) =>
      block.children
        .map((child) =>
          child._type === "span" ? child.text : renderVariable(child.variableId)
        )
        .join("")
    )
    .join(paragraphSeparator);
}

/**
 * Text for showing rich text in the editor's UI, with variables as "{Name}".
 * Deleted variables are left out.
 */
export function richTextToDisplayText(
  richText: RichText,
  variables: Variable[],
  paragraphSeparator = "\n\n"
): string {
  return richTextToPlainText(
    richText,
    (id) => {
      const variable = variables.find((v) => v.id === id);
      return variable ? `{${variable.name}}` : "";
    },
    paragraphSeparator
  );
}

/** Counts references to a variable in rich text. */
export function countRichTextVariableRefs(
  richText: RichText,
  variableId: string
): number {
  let count = 0;
  richText.forEach((block) => {
    block.children.forEach((child) => {
      if (child._type === "variable" && child.variableId === variableId) count++;
    });
  });
  return count;
}

/** Replaces each reference to a variable with plain text, in place. */
export function replaceRichTextVariableRefs(
  richText: RichText,
  variableId: string,
  text: string
) {
  richText.forEach((block) => {
    block.children = block.children.map((child) =>
      child._type === "variable" && child.variableId === variableId
        ? { _type: "span", _key: child._key, text, marks: [] }
        : child
    );
  });
}
