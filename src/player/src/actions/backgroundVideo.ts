import { ActionForPlayback } from "../typings";
import { getStore } from "../store";
import { ensureControlsEnabled, setControlState } from "../media/mediaControls";

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

    if (action.props.loop) video.loop = true;
    if (action.props.muted) video.muted = true;
    if (action.extendedProps.fit) video.classList.add(`fit-${action.extendedProps.fit}`);
    video.classList.add("cl-background-media");
    if (action.props.buildIn === "none") video.classList.add("no-fade-in");
    if (action.props.buildOut === "none") video.dataset.buildOut = "none";
    if (action.props.persist) video.dataset.persist = "true";
    if (action.props.name) {
      video.dataset.bgName = action.props.name;
      store.playback.backgroundVideo[action.props.name] = video;
    }

    // Move to the right layer if not already there (lookahead always lands in .cl-background)
    const target = action.props.persist
      ? store.playback.rootEl.querySelector(".cl-persist-layer")
      : store.playback.rootEl.querySelector(".cl-background");
    if (target && video.parentNode !== target) {
      video.parentNode?.removeChild(video);
      target.appendChild(video);
    } else if (!video.parentNode) {
      target?.appendChild(video);
    }

    video.addEventListener("ended", () => {
      if (action.props.buildOut === "none") {
        if (action.props.name) delete store.playback.backgroundVideo[action.props.name];
        video.parentNode?.removeChild(video);
      } else {
        video.classList.add("clear");
        setTimeout(() => {
          if (action.props.name) delete store.playback.backgroundVideo[action.props.name];
          video.parentNode?.removeChild(video);
        }, 300);
      }
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
