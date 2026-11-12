/*
 * Undo and redo in the project settings window
 *
 * Text fields undo their own typing first. Otherwise, the settings window
 * asks the project window (which owns history) to undo or redo, but only
 * steps that came from settings, so it never changes something that isn't
 * on screen.
 */

import { emitTo } from "@tauri-apps/api/event";
import { getStore } from "../../data/dataStore";
import { canStep, Direction } from "../../data/history";
import { deepActiveElement, isTextElement } from "../../utils/inTextElement";
import { getProjectWindowLabel } from "../../utils/getProjectWindowLabel";
import { expectExternalValue, getActiveCodeEditor } from "./activeCodeEditor";

/** Settings window → project window: undo or redo a settings step */
export const SETTINGS_UNDO_EVENT = "settings-undo-requested";
/** Settings window → project window: send the store (history included) */
export const SETTINGS_SYNC_EVENT = "settings-sync-requested";

export interface SettingsUndoRequest {
  projectId: string;
  direction: Direction;
}

export function handleSettingsUndoRedo(direction: Direction) {
  const focused = deepActiveElement();
  const codeEditor = getActiveCodeEditor();
  if (codeEditor && focused === codeEditor.textarea) {
    // The Custom CSS editor keeps its own history
    const offset = direction === "undo" ? -1 : 1;
    const history = codeEditor.extensions.history;
    if (history?.has(offset)) {
      history.go(offset);
      return;
    }
    // Nothing left there, so continue in project history, and show the
    // result even though the editor is focused
    expectExternalValue();
  } else if (isTextElement(focused)) {
    // TODO: execCommand is deprecated in the HTML spec but remains supported in WKWebView.
    document.execCommand(direction);
    return;
  }
  if (!canStep(direction, "settings")) return;
  const store = getStore();
  const request: SettingsUndoRequest = {
    projectId: store.project.id,
    direction,
  };
  emitTo(getProjectWindowLabel(store.projectPath), SETTINGS_UNDO_EVENT, request);
}
