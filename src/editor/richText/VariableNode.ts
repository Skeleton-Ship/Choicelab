import { Node, InputRule, PasteRule, mergeAttributes } from "@tiptap/core";
import type { Node as PMNode, NodeType } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import type { Range } from "@tiptap/core";
import { getStore } from "../../data/dataStore";
import { getVariable, getVariables } from "../../data/getData";
import { Variable } from "../../typings";

/*
 * An inline, atomic reference to a variable. The document stores only the
 * variable's ID; the chip shows the variable's current name, so renaming a
 * variable updates every reference, and the ID never appears in the UI.
 */

const MISSING_LABEL = "Deleted variable";

export function getVariableLabel(variableId: string): string | null {
  return getVariable(variableId, getStore())?.name ?? null;
}

/** Finds a variable by name, ignoring case and surrounding spaces. */
export function findVariableByName(name: string): Variable | undefined {
  const key = name.trim().toLowerCase();
  if (key === "") return undefined;
  return getVariables(getStore()).find((v) => v.name.trim().toLowerCase() === key);
}

/** Sets a chip's text and state from the variable it references. */
export function refreshVariableChip(dom: HTMLElement, variableId: string) {
  const label = getVariableLabel(variableId);
  const text = label ?? MISSING_LABEL;
  if (dom.textContent !== text) dom.textContent = text;
  dom.classList.toggle("missing", label === null);
}

// Replaces "{Name}" with a chip when the name matches a variable
function replaceNameWithChip(
  state: EditorState,
  range: Range,
  name: string,
  type: NodeType
): void | null {
  const variable = findVariableByName(name);
  if (!variable) return null;
  state.tr.replaceWith(
    range.from,
    range.to,
    type.create({ variableId: variable.id })
  );
}

export const VariableNode = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      variableId: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-variable-id") ?? "",
        renderHTML: (attrs) => ({ "data-variable-id": attrs.variableId }),
      },
    };
  },

  // Used for copying within and between Choicelab fields. The ID lives in an
  // attribute of the copied HTML, which is never displayed.
  parseHTML() {
    return [{ tag: "span[data-variable-id]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const label = getVariableLabel(node.attrs.variableId) ?? MISSING_LABEL;
    return ["span", mergeAttributes(HTMLAttributes, { class: "variable-chip" }), label];
  },

  // Plain-text form, used when copying to other apps
  renderText({ node }) {
    const label = getVariableLabel(node.attrs.variableId);
    return label === null ? "" : `{${label}}`;
  },

  addNodeView() {
    return ({ node }) => {
      let current: PMNode = node;
      const dom = document.createElement("span");
      dom.className = "variable-chip";
      dom.contentEditable = "false";
      dom.setAttribute("data-variable-chip", current.attrs.variableId);
      refreshVariableChip(dom, current.attrs.variableId);
      return {
        dom,
        update: (updated) => {
          if (updated.type !== current.type) return false;
          current = updated;
          dom.setAttribute("data-variable-chip", current.attrs.variableId);
          refreshVariableChip(dom, current.attrs.variableId);
          return true;
        },
        // The chip's text is managed here, not by the editor
        ignoreMutation: () => true,
      };
    };
  },

  addInputRules() {
    const type = this.type;
    return [
      new InputRule({
        find: /\{([^{}]+)\}$/,
        handler: ({ state, range, match }) =>
          replaceNameWithChip(state, range, match[1], type),
      }),
    ];
  },

  addPasteRules() {
    const type = this.type;
    return [
      new PasteRule({
        find: /\{([^{}]+)\}/g,
        handler: ({ state, range, match }) =>
          replaceNameWithChip(state, range, match[1], type),
      }),
    ];
  },
});
