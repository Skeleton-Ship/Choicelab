import type { JSONContent } from "@tiptap/core";
import { RichText, RichTextInline } from "../../typings";
import { createRichTextBlock, createRichTextKey } from "../../data/richText";
import { FUNCTION_KEY_CHARS } from "./blockFunctionKeyChars";

/*
 * Converts between stored rich text (Portable Text) and the editor's document
 * format (ProseMirror JSON):
 * - Blocks map to paragraphs.
 * - Spans map to text; a "\n" in a span maps to a hard break node.
 * - The "variable" inline object maps to the "variable" node.
 */

// Splits span text into text and hard break nodes
function textToNodes(text: string, singleLine: boolean): JSONContent[] {
  const nodes: JSONContent[] = [];
  const cleaned = text.replace(FUNCTION_KEY_CHARS, "");
  const lines = singleLine ? [cleaned.replace(/\n/g, " ")] : cleaned.split("\n");
  lines.forEach((line, i) => {
    if (i > 0) nodes.push({ type: "hardBreak" });
    // ProseMirror doesn't allow empty text nodes
    if (line !== "") nodes.push({ type: "text", text: line });
  });
  return nodes;
}

/**
 * @param singleLine - For fields that hold one paragraph: paragraphs and line
 *                     breaks are joined with spaces, rather than lost.
 */
export function docFromRichText(richText: RichText, singleLine = false): JSONContent {
  let paragraphs: JSONContent[][] = richText.map((block) => {
    const content: JSONContent[] = [];
    block.children.forEach((child) => {
      if (child._type === "span") {
        content.push(...textToNodes(child.text, singleLine));
      } else if (child._type === "variable") {
        content.push({
          type: "variable",
          attrs: { variableId: child.variableId },
        });
      }
    });
    return content;
  });
  if (singleLine && paragraphs.length > 1) {
    paragraphs = [
      paragraphs.flatMap((content, i) =>
        i > 0 ? [{ type: "text", text: " " }, ...content] : content
      ),
    ];
  }
  if (paragraphs.length === 0) paragraphs.push([]);
  return {
    type: "doc",
    content: paragraphs.map((content) =>
      content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" }
    ),
  };
}

export function richTextFromDoc(doc: JSONContent): RichText {
  const blocks = (doc.content ?? []).map((paragraph) => {
    const children: RichTextInline[] = [];
    // Adds text to the preceding span, or starts a new one
    const appendText = (text: string) => {
      const last = children[children.length - 1];
      if (last && last._type === "span") last.text += text;
      else children.push({ _type: "span", _key: createRichTextKey(), text, marks: [] });
    };
    (paragraph.content ?? []).forEach((node) => {
      if (node.type === "text" && node.text) {
        const text = node.text.replace(FUNCTION_KEY_CHARS, "");
        if (text) appendText(text);
      } else if (node.type === "hardBreak") {
        appendText("\n");
      } else if (node.type === "variable") {
        const variableId: unknown = node.attrs?.variableId;
        if (typeof variableId === "string" && variableId !== "") {
          children.push({
            _type: "variable",
            _key: createRichTextKey(),
            variableId,
          });
        }
      }
    });
    return createRichTextBlock(children);
  });
  // A single empty paragraph is an empty field
  if (blocks.length === 1 && blocks[0].children.length === 0) return [];
  return blocks;
}
