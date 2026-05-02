import { getStore } from "./store";
import { log, warn, error } from "./logging";
import { MediaItem } from "./typings";
import {
  setControlState,
  setScrubberProgress,
  clearScrubber,
  removeScrubberListeners,
} from "./media/mediaControls";
import { playMedia } from "./media/playPause";
/*
 Media in Choicelab is synchronous and sequential. That means media plays in order, one after another. This makes for nice, predictable behavior and a good authoring experience, but that means managing playback requires a few steps.
 
 When a cell fires a media action in Choicelab:
 
 1. First, the media is REGISTERED. We add that media to a playback queue so when it comes time to play it, we know what it is. It gets added to the DOM but it's hidden.
 2. Once we reach that media in the queue, it is ENQUEUED. We make it active in the DOM, we register it with the media controls and all that good stuff to make it play right.
 3. The media plays through, and we have play and pause actions for that.
 4. Once it's done, the media ENDS. It's removed from the playback queue, we unregister the controls, and move on to the next media in the queue.
 
 */

/*
 * Load media into the playback queue
 */
export function registerMedia(props: {
  id: string;
  type: string;
  el?: any;
  fn?: { play: Function; pause: Function };
}) {
  const store = getStore();
  const thisMedia = getMediaById(props.id);
  if (thisMedia) {
    warn(
      `The media with the ID ${props.id} is already in the media queue, and will not be loaded again.`
    );
    return;
  }
  const media = store.playback.media;
  const mediaItem: MediaItem = {
    id: props.id,
    type: props.type,
    fn: props.fn ? props.fn : undefined,
    el: props.el ? props.el : undefined,
  };
  media.items.push(mediaItem);
  // Add media to DOM
  const bgLayer = store.playback.rootEl.querySelector(".cl-background");
  if (!bgLayer) {
    error(
      `The background layer could not be found, and media can't be rendered.`
    );
    return;
  }
  switch (mediaItem.type) {
    case "video":
      const videoEl = mediaItem.el as HTMLVideoElement;
      videoEl.classList.add("cl-action");
      videoEl.classList.add("cl-media");
      bgLayer.appendChild(videoEl);
      break;
  }
  // Trigger play function
  // setControlState("enabled");
  // if (media.autoplay === true) {
  // playMedia();
  // }
}

/*
 * Low-level function to retrieve a media item in the items array
 */
export function getMediaById(id: string) {
  const store = getStore();
  let thisItem: MediaItem | undefined;
  const media = store.playback.media;
  media.items.forEach((item) => {
    if (item.id === id) {
      thisItem = item as MediaItem;
    }
  });
  return thisItem;
}

/*
 * Get the current media and return it
 */
export function getCurrentMedia() {
  const store = getStore();
  const media = store.playback.media;
  let item: MediaItem | undefined;
  if (media.currentItem === false) {
    log("No media is present.");
  } else {
    const itemId = media.currentItem.id;
    item = getMediaById(itemId);
    if (!item) {
      error(`No media found with this ID:`, itemId);
      return;
    }
  }
  if (!item) return false;
  return item;
}

/*
 * Enqueue media
 */
export function enqueueMedia(id: string) {
  const store = getStore();
  const media = store.playback.media;
  // Find media item
  const mediaItem = getMediaById(id);
  if (!mediaItem) {
    error(`No media item with this ID could be enqueued:`, id);
    return;
  }
  media.currentItem = mediaItem;
  // Make element active
  store.playback.rootEl
    .querySelector(".cl-background .cl-media.active")
    ?.classList.remove("active");
  mediaItem.el.classList.add("active");
  // Enable play control
  setControlState("enabled");
  // Enable scrubber
  const scrubber = store.playback.rootEl.querySelector(
    ".cl-controls .scrubber"
  ) as HTMLDivElement;
  if (scrubber) {
    removeScrubberListeners();
    media.scrubber.tapEvent = scrubber.addEventListener("click", (e) => {
      const clickPosition = e.offsetX;
      const percent = clickPosition / scrubber.offsetWidth;
      const newDuration = mediaItem.el.duration * percent;
      mediaItem.el.currentTime = newDuration;
    });
    scrubber.classList.add("active");
  }
  media.scrubber.interval = setInterval(() => {
    let scrubberPercent: number = 0;
    switch (mediaItem.type) {
      case "video":
      case "audio":
        scrubberPercent = mediaItem.el.currentTime / mediaItem.el.duration;
        break;
    }
    const progress = scrubber.querySelector(".progress") as HTMLDivElement;
    if (!progress) {
      warn(`The scrubber's progress element could not be found.`);
      return;
    }
    setScrubberProgress(scrubberPercent, progress);
  }, 25);
  // Play!
  if (media.autoplay === true) {
    playMedia();
  }
}

function getNextMedia() {
  const media = getStore().playback.media;
  const currentItem = media.currentItem;
  if (!currentItem) return false;
  const currentItemId = currentItem.id;
  let nextIndex;
  for (var i = 0; i < media.items.length; i++) {
    let item = media.items[i];
    if (item.id === currentItemId) {
      nextIndex = i + 1;
      break;
    }
  }
  if (nextIndex) {
    const nextItem = media.items[nextIndex];
    if (nextItem) {
      return nextItem.id;
    }
  }
}

export function forceEndMedia() {
  const media = getStore().playback.media;
  const currentItem = media.currentItem;
  if (!currentItem) return false;
  currentItem.el.pause();
  currentItem.el.currentTime = 0;
  const ended = new Event("ended");
  currentItem.el.dispatchEvent(ended);
}

/*
 * Callback function that a media action fires when it ends
 */
export function mediaEnded(id: string) {
  log(`The media with the ID ${id} ended.`);
  const mediaItem = getMediaById(id);
  if (!mediaItem) {
    error(`No media with the ID ${id} was found.`);
    return;
  }
  // Get next media, if it exists
  const nextMediaId = getNextMedia();
  if (nextMediaId) {
    enqueueMedia(nextMediaId);
  } else {
    setControlState("idle");
  }
}

export function clearMediaItems(delay: number) {
  const store = getStore();
  const media = store.playback.media;
  clearScrubber();
  media.items = [];
  media.currentItem = false;
  setControlState("disabled");
  const bgLayer = store.playback.rootEl.querySelector(".cl-background");
  bgLayer?.classList.add("clear");
  setTimeout(() => {
    const mediaItemEls = store.playback.rootEl.querySelectorAll(
      ".cl-background .cl-media"
    );
    mediaItemEls.forEach((el) => {
      el.parentNode?.removeChild(el);
    });
    bgLayer?.classList.remove("clear");
  }, delay);
}
