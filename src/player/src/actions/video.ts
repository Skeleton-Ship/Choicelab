import { ActionForPlayback } from "../typings";
import { getStore } from "../store";
import { registerMedia, mediaEnded } from "../media";

const action = {
  render: (action: ActionForPlayback, done: Function) => {
    const store = getStore();

    // Promote lookahead element if one was pre-inserted for this action
    const lookahead = store.playback.rootEl.querySelector(
      `[data-lookahead-id="${action.id}"]`
    ) as HTMLVideoElement | null;

    let video: HTMLVideoElement;
    if (lookahead) {
      video = lookahead;
      delete video.dataset.lookaheadId;
      video.classList.remove("cl-lookahead");
    } else {
      video = document.createElement("video");
      video.setAttribute("src", store.project.projectPath + "/Assets/" + action.props.source);
      video.setAttribute("playsinline", "");
    }

    if (action.extendedProps["choicelab-player-html5"]?.fit) video.classList.add(`fit-${action.extendedProps["choicelab-player-html5"].fit}`);
    if (action.props.muted) video.muted = true;

    let endCell = false;
    if (action.props.hasOwnProperty("endCell")) endCell = action.props.endCell;

    registerMedia({
      id: action.id,
      type: "video",
      el: video,
      buildIn: action.props.buildIn,
      buildOut: action.props.buildOut,
    });
    video.addEventListener(
      "ended",
      () => {
        mediaEnded(action.id);
        done({ forceEnd: endCell });
      },
      { once: true }
    );
  },
};

export { action };
