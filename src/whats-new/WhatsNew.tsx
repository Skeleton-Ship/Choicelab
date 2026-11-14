import { useEffect } from "preact/hooks";
import { emitWindowReady } from "../utils/emitWindowReady";
import Markdown from "preact-markdown";
import whatsNewContent from "./WhatsNew.md?raw";
import WhatsNewPoster from "../assets/whats-new/WhatsNew-Poster.png";

export function WhatsNew() {
  useEffect(() => {
    emitWindowReady({
      label: "whatsNew",
    });
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
