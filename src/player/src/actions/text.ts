import { ActionDone, ActionForPlayback } from "../typings";
import { render, clear, createActionWrapper } from "../rendering";
import { appendRichTextBlock } from "../richText";

const action = {
  render: (action: ActionForPlayback<"text">, done: ActionDone) => {
    const blocks = action.props.contents;
    const role = action.props.role;
    if (role === "heading" || role === "subheading") {
      // Headings can't contain paragraphs, so paragraphs become line breaks
      const el = createActionWrapper(role === "heading" ? "h1" : "h2", action);
      blocks.forEach((block, i) => {
        if (i > 0) el.appendChild(document.createElement("br"));
        appendRichTextBlock(el, block.children);
      });
      render(el, action);
    } else {
      // Body text: one <p> per paragraph
      const el = createActionWrapper("div", action);
      el.classList.add("body");
      blocks.forEach((block) => {
        const p = document.createElement("p");
        appendRichTextBlock(p, block.children);
        // Keep empty paragraphs one line tall, as they look in the editor
        if (!p.hasChildNodes()) p.appendChild(document.createElement("br"));
        el.appendChild(p);
      });
      render(el, action);
    }
    done();
  },
  clear: (action: ActionForPlayback<"text">) => {
    clear(action);
  },
};

export { action };
