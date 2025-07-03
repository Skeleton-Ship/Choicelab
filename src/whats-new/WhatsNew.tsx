import { useEffect } from "preact/hooks";
import { setMenu } from "../menu/setMenu";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import Markdown from "preact-markdown";
import whatsNewContent from "./WhatsNew.md?raw";
const appWindow = getCurrentWebviewWindow();

export function WhatsNew() {
  useEffect(() => {
    setMenu("launcher"); // we can use the same menu as the launcher
    emit("window-ready", {
      label: "whats-new",
    });
    listen("menu-request-quit", () => {
      appWindow.close();
    });
    listen("tauri://focus", async () => {
      const focused = await appWindow.isFocused();
      if (focused === false) return;
      setMenu("launcher");
    });
  }, []);
  return (
    <div id="whats-new" className="whats-new">
      <Markdown>{whatsNewContent}</Markdown>
    </div>
  );
}
