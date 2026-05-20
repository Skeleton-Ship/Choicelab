import { ActionForPlayback } from "../typings";
import { getStore } from "../store";
import { registerMedia, mediaEnded } from "../media";
import { setCaptionsSource } from "../captions";

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

    const vttUrl = action.props.captions
      ? store.project.projectPath + "/Assets/" + action.props.captions
      : null;
    setCaptionsSource(audio, vttUrl);

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
