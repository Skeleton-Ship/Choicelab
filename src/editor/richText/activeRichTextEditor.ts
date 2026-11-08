import type { Editor } from "@tiptap/core";

/*
 * Tracks the most recently focused rich text field, so the app's menus can act
 * on it: Undo/Redo use the field's own history (execCommand("undo") doesn't
 * reach ProseMirror), and Insert Variable inserts into it.
 */
let activeEditor: Editor | null = null;

export function setActiveRichTextEditor(editor: Editor) {
  activeEditor = editor;
}

/** Forgets the field, unless another one has become active since. */
export function clearActiveRichTextEditor(editor: Editor) {
  if (activeEditor === editor) activeEditor = null;
}

// Checks where focus actually is, rather than trusting focus events
function getFocusedEditor(): Editor | null {
  if (!activeEditor || activeEditor.isDestroyed) return null;
  const focused = document.activeElement;
  return focused && activeEditor.view.dom.contains(focused) ? activeEditor : null;
}

/** Runs undo/redo in the focused rich text field. Returns false if there isn't one. */
export function richTextUndoRedo(undoOrRedo: "undo" | "redo"): boolean {
  const editor = getFocusedEditor();
  if (!editor) return false;
  if (undoOrRedo === "undo") editor.commands.undo();
  else editor.commands.redo();
  return true;
}

/** Whether a rich text field has focus (enables Edit > Insert Variable). */
export function hasActiveRichTextEditor(): boolean {
  return getFocusedEditor() !== null;
}

/** Opens the variable list at the caret in the focused rich text field. */
export function insertVariableInActiveField() {
  const editor = getFocusedEditor();
  if (!editor) return;
  // Typing "{" is what opens the list, so insert one
  editor.chain().focus().insertContent("{").run();
}
