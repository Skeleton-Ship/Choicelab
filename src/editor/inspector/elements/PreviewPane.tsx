import { useEffect, useRef, useState } from "preact/hooks";
import { listen } from "@tauri-apps/api/event";

import { makeResizable } from "../functions/makeResizable";
import { getViewStore } from "../../../data/dataStore";
export function PreviewPane() {
  const viewStore = getViewStore();
  const previewRef = useRef(null);
  const [port, _setPort] = useState(viewStore.previewPort); // Default port

  useEffect(() => {
    if (!previewRef.current) return;
    makeResizable(previewRef.current);
  }, []);

  return (
    <div id="project-preview" ref={previewRef}>
      <iframe id="preview-frame" src={`http://localhost:${port}`}></iframe>
      <div class="resizer vertical"></div>
    </div>
  );
}
