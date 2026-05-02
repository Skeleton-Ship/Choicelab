import { ActionForPlayback } from "../typings";
import { getStore } from "../store";
import { registerMedia, mediaEnded } from "../media";

const action = {
  render: (action: ActionForPlayback, done: Function) => {
    const store = getStore();
    let video = document.createElement("video");
    const src = store.project.projectPath + "/Assets/" + action.props.source;
    if (action.extendedProps.fit) {
      video.classList.add(`fit-${action.extendedProps.fit}`);
    }
    video.setAttribute("src", src);
    video.setAttribute("playsinline", "");
    let endCell = false;
    if (action.props.hasOwnProperty("endCell")) {
      endCell = action.props.endCell;
    }
    registerMedia({
      id: action.id,
      type: "video",
      el: video,
    });
    video.addEventListener(
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
