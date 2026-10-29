import { ActionDone, ActionForPlayback } from "../typings";
import { render, clear, createActionWrapper } from "../rendering";

const action = {
  render: (action: ActionForPlayback<"text">, done: ActionDone) => {
    let tag = "p";
    switch (action.props.role) {
      case "heading":
        tag = "h1";
        break;
      case "subheading":
        tag = "h2";
        break;
    }
    const el = createActionWrapper(tag, action);
    el.innerText = action.props.contents;
    render(el, action);
    done();
  },
  clear: (action: ActionForPlayback<"text">) => {
    clear(action);
  },
};

export { action };
