import { ActionForPlayback } from "../typings";
import { getStore } from "../store";
import { ensureControlsEnabled, setControlState } from "../media/mediaControls";

const action = {
  render: (action: ActionForPlayback, done: Function) => {
    const store = getStore();
    const video = document.createElement("video");
    const src = store.project.projectPath + "/Assets/" + action.props.source;
    video.setAttribute("src", src);
    video.setAttribute("playsinline", "");
    if (action.props.loop) video.loop = true;
    if (action.props.muted) video.muted = true;
    if (action.extendedProps.fit) video.classList.add(`fit-${action.extendedProps.fit}`);
    video.classList.add("cl-background-media");
    if (action.props.persist) video.dataset.persist = "true";
    if (action.props.name) {
      video.dataset.bgName = action.props.name;
      store.playback.backgroundVideo[action.props.name] = video;
    }
    const target = action.props.persist
      ? store.playback.rootEl.querySelector(".cl-persist-layer")
      : store.playback.rootEl.querySelector(".cl-background");
    target?.appendChild(video);
    video.addEventListener("ended", () => {
      video.classList.add("clear");
      setTimeout(() => {
        if (action.props.name) delete store.playback.backgroundVideo[action.props.name];
        video.parentNode?.removeChild(video);
      }, 300);
    }, { once: true });
    if (store.playback.media.autoplay) {
      video.play().catch(() => {});
      store.playback.media.playing = true;
      setControlState("playing");
    } else {
      store.playback.media.pendingBackgroundMedia.push(video);
      ensureControlsEnabled();
    }
    done({});
  },
};

export { action };
