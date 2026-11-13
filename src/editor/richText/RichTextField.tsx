import { useEffect, useLayoutEffect, useRef } from "preact/hooks";
import { Editor, Extension } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import { UndoRedo } from "@tiptap/extensions";
import { RichText, UpdateFunction } from "../../typings";
import { getViewStore, setViewStore } from "../../data/dataStore";
import { setMenu } from "../../menu/setMenu";
import { VariableNode, refreshVariableChip } from "./VariableNode";
import { VariableSuggestion } from "./variableSuggestion";
import { VariableChipPicker } from "./variableChipPicker";
import { BlockFunctionKeyChars } from "./blockFunctionKeyChars";
import { docFromRichText, richTextFromDoc } from "./convert";
import { setActiveRichTextEditor, clearActiveRichTextEditor } from "./activeRichTextEditor";
import { GuardNativeHistory } from "./guardNativeHistory";

/*
 * A text field that can contain variable references, shown as chips with the
 * variable's name. Commits on blur, like the plain text fields.
 */

// Single-line fields hold one paragraph, and ignore Return
const SingleLineDocument = Document.extend({ content: "paragraph" });
const BlockReturn = Extension.create({
  name: "blockReturn",
  // Below the variable list, which uses Return to pick
  priority: 50,
  addKeyboardShortcuts() {
    return { Enter: () => true, "Shift-Enter": () => true };
  },
});

export default function RichTextField(props: {
  value: RichText;
  multiline: boolean;
  id?: string;
  /** ID of the element that labels this field */
  labelledBy?: string;
  onCommit: (value: RichText) => void;
  update: UpdateFunction;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  // The editor's callbacks are created once, so read props through a ref
  const propsRef = useRef(props);
  propsRef.current = props;

  const singleLine = !props.multiline;
  const valueJSON = JSON.stringify(docFromRichText(props.value, singleLine));

  // Create the editor before the browser paints, so the field appears at its
  // full height rather than flashing empty for a frame
  useLayoutEffect(() => {
    if (!hostRef.current) return;
    const editor = new Editor({
      element: hostRef.current,
      extensions: [
        props.multiline ? Document : SingleLineDocument,
        Paragraph,
        Text,
        UndoRedo,
        VariableNode,
        VariableSuggestion,
        VariableChipPicker,
        BlockFunctionKeyChars,
        GuardNativeHistory,
        // Shift-Return adds a line break within a paragraph
        ...(props.multiline ? [HardBreak] : [BlockReturn]),
      ],
      content: docFromRichText(props.value, singleLine),
      editorProps: {
        attributes: {
          class: `rich-text-field ${props.multiline ? "ui-text-area multiline" : "ui-text-field"}`,
          role: "textbox",
          "aria-multiline": String(props.multiline),
          autocorrect: "off",
          ...(props.id ? { id: props.id } : {}),
          ...(props.labelledBy ? { "aria-labelledby": props.labelledBy } : {}),
        },
      },
      onFocus: () => {
        setActiveRichTextEditor(editor);
        const viewStore = getViewStore();
        viewStore.inTextElement = true;
        setViewStore(viewStore);
        propsRef.current.update(false, false);
        setMenu();
      },
      onBlur: () => {
        clearActiveRichTextEditor(editor);
        // WebKit keeps the page's selection (and draws its caret) in editable
        // content even after focus moves to a non-text element, like a
        // dropdown. Once focus has moved, clear it if it's still in here.
        // The editor restores it when refocused.
        setTimeout(() => {
          if (editor.isDestroyed || !document.hasFocus()) return;
          if (editor.view.dom.contains(document.activeElement)) return;
          const selection = window.getSelection();
          if (selection?.anchorNode && editor.view.dom.contains(selection.anchorNode)) {
            selection.removeAllRanges();
          }
        });
        const viewStore = getViewStore();
        viewStore.inTextElement = false;
        setViewStore(viewStore);
        setMenu();
        const current = JSON.stringify(editor.getJSON());
        const stored = JSON.stringify(
          docFromRichText(propsRef.current.value, singleLine)
        );
        if (current !== stored) {
          propsRef.current.onCommit(richTextFromDoc(editor.getJSON()));
        }
      },
    });
    editorRef.current = editor;
    return () => {
      clearActiveRichTextEditor(editor);
      editor.destroy();
      editorRef.current = null;
    };
  }, [props.multiline]);

  // Sync when the stored value changes elsewhere (e.g. undo/redo)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.isFocused) return;
    if (JSON.stringify(editor.getJSON()) === valueJSON) return;
    editor.commands.setContent(JSON.parse(valueJSON), { emitUpdate: false });
  }, [valueJSON]);

  // Keep chip names current (e.g. after renaming a variable)
  useEffect(() => {
    hostRef.current
      ?.querySelectorAll<HTMLElement>("[data-variable-chip]")
      .forEach((chip) => {
        refreshVariableChip(chip, chip.getAttribute("data-variable-chip") ?? "");
      });
  });

  return <div class="rich-text-host" ref={hostRef} />;
}
