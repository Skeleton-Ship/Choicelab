import { ActionForPlayback } from "../typings";
import { render, clear, createActionWrapper } from "../rendering";

const action = {
  render: (action: ActionForPlayback, done: Function) => {
    let tag = "p";
    switch (action.extendedProps["choicelab-player-html5"]?.role) {
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
  clear: (action: ActionForPlayback) => {
    clear(action);
  },
};

export { action };
