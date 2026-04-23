import { useState, useEffect } from "preact/hooks";
import { getStore, getViewStore } from "../../../data/dataStore";
import { getPlayerSettings } from "../../../data/getData";

export function PreviewPane() {
  const viewStore = getViewStore();
  const [port, _setPort] = useState(viewStore.previewPort);
  const [isLoading, setIsLoading] = useState(false);

  const appearance = getPlayerSettings(getStore(), "appearance");
  const backgroundColor =
    appearance?.background?.kind === "color"
      ? appearance.background.color
      : undefined;

  useEffect(() => {
    const iframe = document.getElementById("preview-frame") as HTMLIFrameElement | null;
    if (!iframe) return;
    const observer = new MutationObserver(() => setIsLoading(true));
    observer.observe(iframe, { attributes: true, attributeFilter: ["src"] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <iframe
        id="preview-frame"
        src={`http://localhost:${port}?startMediaOnLoad=false`}
        onLoad={() => setIsLoading(false)}
      />
      {isLoading && backgroundColor && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor,
            zIndex: 10,
          }}
        />
      )}
    </>
  );
}
