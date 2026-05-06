import { useEffect, useState, useRef, useMemo } from "preact/hooks";
import { MediaControl } from "../inspector/elements/MediaControl";
import { Action } from "../../typings";
import { v4 as uuid } from "uuid";

export default function AssetPreview(props: {
  media: string;
  assetParent: "action" | "none";
  fileName: string;
  fileSrc: string;
  action?: Action;
  update?: Function;
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
  // Typed as Element so it can serve as a ref for video, audio, or img without three separate refs.
  const mediaRef = useRef<Element | null>(null);
  // Stable ID for the lifetime of this component instance.
  const mediaId = useMemo(
    () =>
      props.assetParent === "action" && props.action
        ? props.action.id
        : uuid(),
    []
  );
  let mediaControl = null;
  if (props.assetParent === "action" && props.action) {
    if (props.update) {
      mediaControl = (
        <MediaControl
          media={mediaEl}
          actionId={props.action.id}
          update={props.update}
        />
      );
    } else {
      console.error(
        "No update function was passed to AssetPreview. Media controls will be disabled."
      );
    }
  }
  let previewEl = <></>;
  switch (props.media) {
    case "image":
      previewEl = (
        <>
          <img
            class="media-preview"
            src={mediaSrc}
            data-id={`media_preview_${mediaId}`}
            ref={mediaRef as preact.RefObject<HTMLImageElement>}
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
            data-id={`media_preview_${mediaId}`}
            ref={mediaRef as preact.RefObject<HTMLVideoElement>}
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
            data-id={`media_preview_${mediaId}`}
            ref={mediaRef as preact.RefObject<HTMLAudioElement>}
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
        setMediaEl(mediaRef.current);
      }
    }, 150);
  }, [props.fileSrc]);
  return previewEl;
}
