import { useEffect } from "preact/hooks";
import { emitWindowReady } from "../utils/emitWindowReady";
import Markdown from "preact-markdown";
import whatsNewContent from "./WhatsNew.md?raw";
import WhatsNewPoster from "../assets/whats-new/WhatsNew-Poster.png";

export function WhatsNew() {
  useEffect(() => {
    // Load the version number's font before showing the window. It only
    // starts loading once laid out, which a hidden window may not have done.
    document.fonts
      .load('900 52px "Inter Variable"', "1.2")
      .catch(() => {})
      .finally(() => emitWindowReady({ label: "whatsNew" }));
  }, []);
  const el = Markdown(whatsNewContent);
  return (
    <div id="whats-new" className="whats-new" data-tauri-drag-region>
      <div class="inner">
        <div class="poster">
          <img src={WhatsNewPoster} />
          <h1>New in Choicelab</h1>
        </div>
        {el}
      </div>
    </div>
  );
}
