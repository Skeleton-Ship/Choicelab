import { getCurrentMedia } from "../media";
import { getStore } from "../store";
import { setControlState } from "./mediaControls";

/*
 * Play the current media using its given play method
 */
export function playMedia() {
  const store = getStore();
  const media = store.playback.media;
  // Get current media and play it
  const currentMedia = getCurrentMedia();
  if (!currentMedia) {
    return;
  }
  switch (currentMedia.type) {
    case "video":
    case "audio":
      currentMedia.el.play();
      break;
  }
  // Update state
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
  if (!currentMedia) {
    return;
  }
  switch (currentMedia.type) {
    case "video":
    case "audio":
      currentMedia.el.pause();
      break;
  }
  // Update state
  setControlState("paused");
  media.playing = false;
}
