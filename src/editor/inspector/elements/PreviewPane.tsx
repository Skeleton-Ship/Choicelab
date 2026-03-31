import { useState } from "preact/hooks";
import { getViewStore } from "../../../data/dataStore";

export function PreviewPane() {
  const viewStore = getViewStore();
  const [port, _setPort] = useState(viewStore.previewPort); // Default port

  return (
      <iframe
        id="preview-frame"
        src={`http://localhost:${port}?startMediaOnLoad=false`}
      ></iframe>
  );
}
