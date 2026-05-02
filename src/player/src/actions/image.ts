import { ActionForPlayback } from "../typings";
import { render, createActionWrapper, clear } from "../rendering";
import { getStore } from "../store";

const action = {
  render: (action: ActionForPlayback, done: Function) => {
    const store = getStore();
    let imageParent = createActionWrapper("figure", action);
    let image = document.createElement("img");
    const src = store.project.projectPath + "/Assets/" + action.props.source;
    image.setAttribute("src", src);
    image.setAttribute("alt", action.props.alt);
    imageParent.appendChild(image);
    render(imageParent, action);
    done();
  },
  clear: (action: ActionForPlayback) => {
    clear(action);
  },
};

export { action };
