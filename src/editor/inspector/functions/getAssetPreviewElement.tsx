import { createRef } from "preact";
import { useEffect } from "preact/hooks";
import { MediaControl } from "../elements/MediaControl";
import { Action } from "../../../typings";

function setImageSrc(el: HTMLImageElement, url: string, iteration: number = 0) {
  try {
    el.src = url;
  } catch (e) {
    if (iteration < 1000) {
      setImageSrc(el, url, iteration + 1);
    } else {
      el.src = "";
    }
  }
}

export default function getAssetPreviewElement(
  previewType: string,
  fileName: string,
  fileSrc: string,
  action: Action,
  update: Function
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
    case "audio":
      previewEl = (
        <>
          <MediaControl src={fileSrc} actionId={action.id} update={update} />
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
        setImageSrc(mediaRef.current, fileSrc, 0);
      }
    }, 150);
  });
  return previewEl;
}
