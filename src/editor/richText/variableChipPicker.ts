import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, NodeSelection, TextSelection, EditorState } from "@tiptap/pm/state";
import { getStore } from "../../data/dataStore";
import { getVariables } from "../../data/getData";
import { createVariablePicker } from "./variablePicker";

/*
 * Selecting a variable chip opens the variable list, to swap which variable it
 * references. Arrow keys move, Return or Tab swaps, Escape closes the list.
 */

function getSelectedChip(state: EditorState) {
  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.type.name === "variable") {
    return { pos: selection.from, variableId: String(selection.node.attrs.variableId) };
  }
  return null;
}

export const VariableChipPicker = Extension.create({
  name: "variableChipPicker",
  priority: 1000,
  addProseMirrorPlugins() {
    // The chip the list is open for (or was dismissed for), as "pos:id"
    let openFor: string | null = null;
    let dismissedFor: string | null = null;
    let picker: ReturnType<typeof createVariablePicker> | null = null;

    function close() {
      picker?.hide();
      openFor = null;
    }

    return [
      new Plugin({
        key: new PluginKey("variableChipPicker"),
        view: (view) => {
          picker = createVariablePicker((variable) => {
            const chip = getSelectedChip(view.state);
            if (!chip) return;
            const tr = view.state.tr.setNodeMarkup(chip.pos, undefined, {
              variableId: variable.id,
            });
            // Put the caret after the chip, which closes the list
            const after = chip.pos + (tr.doc.nodeAt(chip.pos)?.nodeSize ?? 1);
            tr.setSelection(TextSelection.create(tr.doc, after));
            view.dispatch(tr);
            view.focus();
          });
          const update = () => {
            const chip = getSelectedChip(view.state);
            if (!chip || !view.hasFocus()) {
              dismissedFor = null;
              close();
              return;
            }
            const key = `${chip.pos}:${chip.variableId}`;
            if (key === dismissedFor) return;
            if (key === openFor) {
              picker?.reposition();
              return;
            }
            const variables = getVariables(getStore());
            const index = variables.findIndex((v) => v.id === chip.variableId);
            const dom = view.nodeDOM(chip.pos);
            picker?.show(
              variables,
              index,
              () => (dom instanceof HTMLElement ? dom.getBoundingClientRect() : null),
              dom instanceof HTMLElement ? dom : view.dom
            );
            openFor = key;
          };
          update();
          return { update, destroy: close };
        },
        props: {
          handleKeyDown(_view, event) {
            if (!picker?.isOpen()) return false;
            switch (event.key) {
              case "ArrowDown":
              case "ArrowUp":
                picker.move(event.key === "ArrowDown" ? 1 : -1);
                return true;
              case "Enter":
              case "Tab":
                picker.pick();
                return true;
              case "Escape":
                dismissedFor = openFor;
                close();
                return true;
            }
            return false;
          },
          handleDOMEvents: {
            blur: () => {
              close();
              return false;
            },
          },
        },
      }),
    ];
  },
});
