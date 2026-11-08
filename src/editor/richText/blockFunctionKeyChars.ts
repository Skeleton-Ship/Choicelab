import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/*
 * macOS represents arrow and other function keys as private-use characters
 * (U+F700–U+F8FF, e.g. U+F702 for left arrow). When an arrow key can't move
 * the caret (at the start or end of the field), WebKit can insert that
 * character into contenteditable content. Block it on every input path.
 */

export const FUNCTION_KEY_CHARS = /[-]/g;

function hasFunctionKeyChar(text: string | null | undefined): boolean {
  if (!text) return false;
  FUNCTION_KEY_CHARS.lastIndex = 0;
  return FUNCTION_KEY_CHARS.test(text);
}

export const BlockFunctionKeyChars = Extension.create({
  name: "blockFunctionKeyChars",
  priority: 1100,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("blockFunctionKeyChars"),
        props: {
          handleTextInput: (_view, _from, _to, text) => hasFunctionKeyChar(text),
          handleKeyPress: (_view, event) =>
            event.charCode >= 0xf700 && event.charCode <= 0xf8ff,
          handleDOMEvents: {
            beforeinput: (_view, event) => {
              if (hasFunctionKeyChar(event.data)) {
                event.preventDefault();
                return true;
              }
              return false;
            },
          },
        },
        // Safety net for anything that reaches the document another way
        // (e.g. ProseMirror reading a DOM change)
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged)) return null;
          const ranges: Array<{ from: number; to: number }> = [];
          newState.doc.descendants((node, pos) => {
            if (!node.isText || !node.text) return;
            for (const match of node.text.matchAll(FUNCTION_KEY_CHARS)) {
              const from = pos + (match.index ?? 0);
              ranges.push({ from, to: from + match[0].length });
            }
          });
          if (ranges.length === 0) return null;
          const tr = newState.tr;
          // Delete from the end, so earlier positions stay valid
          ranges.reverse().forEach(({ from, to }) => tr.delete(from, to));
          return tr;
        },
      }),
    ];
  },
});
