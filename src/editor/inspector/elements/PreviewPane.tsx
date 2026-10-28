import { useEffect } from "preact/hooks";
import { getViewStore } from "../../../data/dataStore";
import { loadPreviewFrame } from "../../../preview/previewFrames";

export function PreviewPane() {
  const port = getViewStore().previewPort;

  // Frames are managed outside of Preact (see previewFrames.ts)
  useEffect(() => {
    loadPreviewFrame(`http://localhost:${port}?startMediaOnLoad=false`);
  }, []);

  return <div id="preview-frames" />;
}
