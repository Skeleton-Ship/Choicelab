import { useEffect, useRef } from "preact/hooks";

import { makeResizable } from "./functions/makeResizable";
export function PreviewPane() {
  const previewRef = useRef(null);
  useEffect(() => {
    if (!previewRef.current) return;
    makeResizable(previewRef.current);
  });
  return (
    <div id="project-preview" ref={previewRef}>
      <iframe id="preview-frame" src={`http://localhost:4091`}></iframe>
      <div class="resizer vertical"></div>
    </div>
  );
}
