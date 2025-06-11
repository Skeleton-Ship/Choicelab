import { useEffect, useRef, useState } from "preact/hooks";
import { listen } from "@tauri-apps/api/event";

import { makeResizable } from "../functions/makeResizable";
export function PreviewPane() {
  const previewRef = useRef(null);
  const [port, setPort] = useState(4091); // Default port

  useEffect(() => {
    if (!previewRef.current) return;
    makeResizable(previewRef.current);
    // Listen for preview-port event from backend
    const unlisten = listen("preview-port", (event: any) => {
      if (event && event.payload && event.payload.port) {
        setPort(event.payload.port);
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div id="project-preview" ref={previewRef}>
      <iframe id="preview-frame" src={`http://localhost:${port}`}></iframe>
      <div class="resizer vertical"></div>
    </div>
  );
}
