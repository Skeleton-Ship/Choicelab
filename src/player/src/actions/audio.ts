import { ActionForPlayback } from "../typings";
import { getStore } from "../store";
import { registerMedia, mediaEnded } from "../media";

const action = {
  render: (action: ActionForPlayback, done: Function) => {
    const store = getStore();
    let audio = document.createElement("audio");
    const src = store.project.projectPath + "/Assets/" + action.props.source;
    audio.setAttribute("src", src);
    audio.setAttribute("playsinline", "");
    let endCell = false;
    if (action.props.hasOwnProperty("endCell")) {
      endCell = action.props.endCell;
    }
    registerMedia({
      id: action.id,
      type: "audio",
      el: audio,
    });
    audio.addEventListener(
      "ended",
      () => {
        mediaEnded(action.id);
        done({
          forceEnd: endCell,
        });
      },
      { once: true }
    );
  },
};

export { action };
