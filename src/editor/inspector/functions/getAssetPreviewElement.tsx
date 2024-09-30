import { createRef } from "preact";
import { useEffect, useState } from "preact/hooks";
import { MediaControl } from "../elements/MediaControl";
import { Action } from "../../../typings";

function setMediaSrc(el: HTMLImageElement, url: string, iteration: number = 0) {
  try {
    el.src = url;
  } catch (e) {
    if (iteration < 1000) {
      setMediaSrc(el, url, iteration + 1);
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
  let [mediaControl, setMediaControl] = useState(<></>);
  let previewEl = <></>;
  let mediaRef = createRef();
  useEffect(() => {
    if (mediaRef.current) {
      setMediaControl(
        <MediaControl
          el={mediaRef.current}
          actionId={action.id}
          update={update}
        />
      );
    }
  }, []);
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
          <video class="media-preview" ref={mediaRef}></video>
          {mediaControl}
        </>
      );
      break;
    case "audio":
      previewEl = (
        <>
          <audio class="media-preview" ref={mediaRef}></audio>
          {mediaControl}
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
        setMediaSrc(mediaRef.current, fileSrc, 0);
      }
    }, 150);
  });
  return previewEl;
}
