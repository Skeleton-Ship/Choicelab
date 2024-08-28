import { createRef } from "preact";
import { useEffect } from "preact/hooks";

function setSrc(
  el: HTMLVideoElement | HTMLAudioElement | HTMLImageElement,
  url: string,
  iteration: number = 0
) {
  try {
    el.src = url;
  } catch (e) {
    if (iteration < 1000) {
      setSrc(el, url, iteration + 1);
    } else {
      el.src = "";
    }
  }
}

export default function getAssetPreviewElement(
  previewType: string,
  fileName: string,
  fileSrc: string
) {
  const loadingEl = (
    <span class="loading-text" aria-hidden="true">
      Loading...
    </span>
  );
  let previewEl = <></>;
  let mediaRef = createRef();
  switch (previewType) {
    case "image":
      previewEl = (
        <>
          <img class="media-preview" ref={mediaRef} />
          {loadingEl}
        </>
      );
      break;
    case "video":
      previewEl = (
        <>
          <video class="media-preview" ref={mediaRef} controls></video>
          {loadingEl}
        </>
      );
      break;
    case "audio":
      previewEl = (
        <>
          <audio class="media-preview" ref={mediaRef} controls></audio>
          {loadingEl}
        </>
      );
      break;
    default:
      previewEl = (
        <div class="generic-preview">
          <i class="bi bi-file-earmark"></i> {fileName}
        </div>
      );
  }
  useEffect(() => {
    setTimeout(() => {
      if (mediaRef.current !== null) {
        setSrc(mediaRef.current, fileSrc, 0);
      }
    }, 150);
  });
  return previewEl;
}
