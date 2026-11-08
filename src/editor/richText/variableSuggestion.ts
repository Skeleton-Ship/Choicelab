import { Extension, Range } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { SuggestionProps } from "@tiptap/suggestion";
import { getStore } from "../../data/dataStore";
import { getVariables } from "../../data/getData";
import { Variable } from "../../typings";
import { createVariablePicker } from "./variablePicker";

/*
 * Typing "{" opens a list of variables, filtered by what's typed after it.
 * Arrow keys move, Return or Tab inserts, Escape leaves the typed text as-is.
 */

function filterVariables(query: string): Variable[] {
  const q = query.trim().toLowerCase();
  const variables = getVariables(getStore());
  if (q === "") return variables;
  const starts: Variable[] = [];
  const contains: Variable[] = [];
  variables.forEach((v) => {
    const name = v.name.toLowerCase();
    if (name.startsWith(q)) starts.push(v);
    else if (name.includes(q)) contains.push(v);
  });
  return [...starts, ...contains];
}

function createRenderer() {
  let props: SuggestionProps<Variable, Variable> | null = null;
  const picker = createVariablePicker((variable) => props?.command(variable));
  const anchor = () => props?.clientRect?.() ?? null;
  const context = () => props?.editor.view.dom ?? document.body;
  return {
    onStart(next: SuggestionProps<Variable, Variable>) {
      props = next;
      picker.show(next.items, 0, anchor, context());
    },
    onUpdate(next: SuggestionProps<Variable, Variable>) {
      props = next;
      // Typing narrows the list, so start again from the top
      picker.show(next.items, 0, anchor, context());
    },
    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (!props || props.items.length === 0) return false;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        picker.move(event.key === "ArrowDown" ? 1 : -1);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        picker.pick();
        return true;
      }
      return false;
    },
    onExit() {
      props = null;
      picker.hide();
    },
  };
}

// Plain text (at most 80 characters) up to and including a closing "}"
const THROUGH_CLOSING_BRACE = /^[^{}\n\ufffc]{0,80}\}/;

/**
 * If the caret is inside a typed brace pair, like "{New Var|iable}", extends
 * the range to replace through the "}", so no leftover text remains. Only for
 * plain text on the same line: another brace, a variable, or a line break
 * before the "}" leaves the range as-is.
 */
function extendToClosingBrace(doc: PMNode, range: Range): Range {
  const $to = doc.resolve(range.to);
  // Variables and line breaks become "\ufffc", which stops the match
  const after = $to.parent.textBetween(
    $to.parentOffset,
    $to.parent.content.size,
    undefined,
    "\ufffc"
  );
  const match = THROUGH_CLOSING_BRACE.exec(after);
  return match ? { from: range.from, to: range.to + match[0].length } : range;
}

export const VariableSuggestion = Extension.create({
  name: "variableSuggestion",
  // Run before other keyboard handling (e.g. Return), so the list gets keys first
  priority: 1000,
  addProseMirrorPlugins() {
    return [
      Suggestion<Variable, Variable>({
        editor: this.editor,
        pluginKey: new PluginKey("variableSuggestion"),
        char: "{",
        allowSpaces: true,
        allowedPrefixes: null,
        items: ({ query }) => filterVariables(query),
        // A "}" between the "{" and the caret means the braces are already
        // closed (e.g. "{Unknown name} and more"), so there's nothing to pick
        allow: ({ state, range }) =>
          !state.doc.textBetween(range.from, range.to).includes("}"),
        command: ({ editor, range, props: variable }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(extendToClosingBrace(editor.state.doc, range), [
              { type: "variable", attrs: { variableId: variable.id } },
            ])
            .run();
        },
        render: createRenderer,
      }),
    ];
  },
});
