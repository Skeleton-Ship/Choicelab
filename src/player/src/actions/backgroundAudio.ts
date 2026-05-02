import { ActionForPlayback } from "../typings";
import { getStore } from "../store";
import { ensureControlsEnabled, setControlState } from "../media/mediaControls";

const action = {
  render: (action: ActionForPlayback, done: Function) => {
    const store = getStore();
    const audio = document.createElement("audio");
    const src = store.project.projectPath + "/Assets/" + action.props.source;
    audio.setAttribute("src", src);
    if (action.props.loop) audio.loop = true;
    audio.classList.add("cl-background-media");
    if (action.props.persist) audio.dataset.persist = "true";
    if (action.props.name) {
      audio.dataset.bgName = action.props.name;
      store.playback.backgroundAudio[action.props.name] = audio;
    }
    const target = action.props.persist
      ? store.playback.rootEl.querySelector(".cl-persist-layer")
      : store.playback.rootEl.querySelector(".cl-background");
    target?.appendChild(audio);
    audio.addEventListener(
      "ended",
      () => {
        if (action.props.name)
          delete store.playback.backgroundAudio[action.props.name];
        audio.parentNode?.removeChild(audio);
      },
      { once: true }
    );
    if (store.playback.media.autoplay) {
      console.log("Let's play");
      audio.play().catch(() => {});
      store.playback.media.playing = true;
      setControlState("playing");
    } else {
      store.playback.media.pendingBackgroundMedia.push(audio);
      ensureControlsEnabled();
    }
    done({});
  },
};

export { action };
