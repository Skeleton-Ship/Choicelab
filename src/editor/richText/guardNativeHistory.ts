import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/*
 * Ignores WebKit's built-in undo/redo when it's aimed at a rich text field
 * that isn't focused. WebKit's undo history is shared by the whole page, so
 * undoing in a plain text field (via execCommand("undo")) could otherwise
 * reach into a rich text field. Undo in a focused field goes through the
 * app's menu to the field's own history instead.
 */
export const GuardNativeHistory = Extension.create({
  name: "guardNativeHistory",
  // Before the undo/redo extension, which also listens for these events
  priority: 1100,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("guardNativeHistory"),
        props: {
          handleDOMEvents: {
            beforeinput: (view, event) => {
              const { inputType } = event;
              if (inputType !== "historyUndo" && inputType !== "historyRedo") {
                return false;
              }
              if (view.hasFocus()) return false;
              event.preventDefault();
              return true;
            },
          },
        },
      }),
    ];
  },
});
