import { useEffect } from "preact/hooks";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import Markdown from "preact-markdown";
import whatsNewContent from "./WhatsNew.md?raw";
const appWindow = getCurrentWebviewWindow();

export function WhatsNew() {
  useEffect(() => {
    emit("window-ready", {
      label: "whatsNew",
    });
    listen("menu-request-quit", () => {
      appWindow.close();
    });
  }, []);
  // @ts-ignore
  const el = <Markdown markdown={whatsNewContent} />;
  return (
    <div id="whats-new" className="whats-new" data-tauri-drag-region>
      <div class="inner">
        <h1>
          <span class="icon">💫</span>
          <strong>What’s New</strong> in Choicelab
        </h1>
        {el}
      </div>
    </div>
  );
}
