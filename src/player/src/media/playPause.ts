import { getCurrentMedia } from "../media";
import { getStore } from "../store";
import { setControlState } from "./mediaControls";

function playBackgroundMedia(store: ReturnType<typeof getStore>) {
  Object.values(store.playback.backgroundAudio).forEach((el) =>
    el.play().catch(() => {})
  );
  Object.values(store.playback.backgroundVideo).forEach((el) =>
    el.play().catch(() => {})
  );
}

function pauseBackgroundMedia(store: ReturnType<typeof getStore>) {
  Object.values(store.playback.backgroundAudio).forEach((el) => el.pause());
  Object.values(store.playback.backgroundVideo).forEach((el) => el.pause());
}

/*
 * Play the current media using its given play method
 */
export function playMedia() {
  const store = getStore();
  const media = store.playback.media;
  const currentMedia = getCurrentMedia();
  if (currentMedia) {
    switch (currentMedia.type) {
      case "video":
      case "audio":
        currentMedia.el.play();
        break;
    }
  }
  playBackgroundMedia(store);
  media.playing = true;
  setControlState("playing");
}

/*
 * Pause the current media using its given play method
 */
export function pauseMedia() {
  const store = getStore();
  const media = store.playback.media;
  const currentMedia = getCurrentMedia();
  if (currentMedia) {
    switch (currentMedia.type) {
      case "video":
      case "audio":
        currentMedia.el.pause();
        break;
    }
  }
  pauseBackgroundMedia(store);
  setControlState("paused");
  media.playing = false;
}
