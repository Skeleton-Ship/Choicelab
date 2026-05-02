import { ActionForPlayback } from "../typings";
import { render, createActionWrapper, clear } from "../rendering";
import { onEvent, runEvents } from "../events";
import { setVariable } from "../variables";

const action = {
  render: (action: ActionForPlayback, done: Function) => {
    let el = createActionWrapper("button", action);
    el.innerText = action.props.label;
    render(el, action);
    onEvent(
      "inputSubmit",
      () => {
        el.setAttribute("disabled", "disabled");
      },
      {
        name: `disableButton_${action.id}`,
        once: true,
      }
    );
    el.addEventListener("click", () => {
      // Set a variable if it exists
      if (action.props.varToSet) {
        setVariable(action.props.varToSet, action.props.value);
      }
      // Run input events
      runEvents("inputSubmit");
      // Mark complete
      done({
        forceEnd: true,
      });
    });
  },
  clear: (action: ActionForPlayback) => {
    clear(action);
  },
};

export { action };
