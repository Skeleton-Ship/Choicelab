/*
 * The Custom CSS code editor, if it's showing, so undo and redo in the
 * settings window can use its own history.
 */

import type { PrismEditor } from "prism-code-editor";

let activeEditor: PrismEditor | null = null;
let externalValueExpected = false;

export function setActiveCodeEditor(editor: PrismEditor | null) {
  activeEditor = editor;
  externalValueExpected = false;
}

export function getActiveCodeEditor() {
  return activeEditor;
}

/**
 * Show the next value from the project window even while the editor is
 * focused. (Normally those are skipped as echoes of typing; see
 * AppearanceCustomCSS.) Call before asking the project window to undo.
 */
export function expectExternalValue() {
  externalValueExpected = true;
}

/** Whether a value from the project window was expected; resets the flag */
export function takeExternalValueExpected() {
  const expected = externalValueExpected;
  externalValueExpected = false;
  return expected;
}
