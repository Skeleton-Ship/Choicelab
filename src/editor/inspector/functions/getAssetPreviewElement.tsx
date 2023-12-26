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
  switch (previewType) {
    case "image":
      previewEl = (
        <>
          <img class="media-preview" src={fileSrc} />
          {loadingEl}
        </>
      );
      break;
    case "video":
      previewEl = (
        <>
          <video class="media-preview" src={fileSrc} controls></video>
          {loadingEl}
        </>
      );
      break;
    case "audio":
      previewEl = (
        <>
          <audio class="media-preview" src={fileSrc} controls></audio>
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

  return previewEl;
}
