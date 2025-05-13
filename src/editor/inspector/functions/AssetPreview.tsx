import { createRef } from "preact";
import { useEffect, useState } from "preact/hooks";
import { MediaControl } from "../elements/MediaControl";
import { Action } from "../../../typings";

export default function AssetPreview(props: {
  media: string;
  fileName: string;
  fileSrc: string;
  action: Action;
  update: Function;
}) {
  function handleMediaSrc(
    stateFn: Function,
    url: string,
    iteration: number = 0
  ) {
    const testEl = document.createElement("audio");
    try {
      testEl.src = url;
      stateFn(url);
    } catch (e) {
      if (iteration < 1000) {
        handleMediaSrc(stateFn, url, iteration + 1);
      } else {
        testEl.src = "";
      }
    }
  }
  const loadingEl = (
    <span class="loading-text" aria-hidden="true">
      Loading...
    </span>
  );
  let [mediaSrc, setMediaSrc] = useState("");
  let [mediaEl, setMediaEl]: [
    HTMLVideoElement | HTMLAudioElement | false,
    Function
  ] = useState(false);
  let previewEl = <></>;
  let mediaRef = createRef();
  let mediaControl = (
    <MediaControl
      media={mediaEl}
      actionId={props.action.id}
      update={props.update}
    />
  );
  switch (props.media) {
    case "image":
      previewEl = (
        <>
          <img
            class="media-preview"
            src={mediaSrc}
            data-id={`media_preview_${props.action.id}`}
            ref={mediaRef}
          />
          {loadingEl}
        </>
      );
      break;
    case "video":
      previewEl = (
        <>
          <video
            class="media-preview"
            src={mediaSrc}
            data-id={`media_preview_${props.action.id}`}
            ref={mediaRef}
          ></video>
          {mediaEl !== false ? mediaControl : <></>}
        </>
      );
      break;
    case "audio":
      previewEl = (
        <>
          <audio
            class="media-preview"
            src={mediaSrc}
            data-id={`media_preview_${props.action.id}`}
            ref={mediaRef}
          ></audio>
          {mediaEl !== false ? mediaControl : <></>}
        </>
      );
      break;
    default:
      previewEl = (
        <div class="generic-preview">
          <i class="bi bi-file-earmark"></i> {props.fileName}
        </div>
      );
  }
  useEffect(() => {
    setTimeout(() => {
      if (mediaRef.current !== null) {
        handleMediaSrc(setMediaSrc, props.fileSrc, 0);
        const testEl = document.querySelector(
          `[data-id="media_preview_${props.action.id}"]`
        );
        if (testEl) {
          setMediaEl(testEl);
        }
      }
    }, 150);
  });
  return previewEl;
}
