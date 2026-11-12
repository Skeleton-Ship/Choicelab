import { useState, useEffect, useRef } from "preact/hooks";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { basicEditor } from "prism-code-editor/setups";
import type { PrismEditor } from "prism-code-editor";
import { getStore } from "../../../data/dataStore";
import "prism-code-editor/prism/languages/markup";
import type { AppearancePaneProps } from "./SettingsAppearance";

function getEditorTheme(theme: "light" | "dark") {
  return theme === "light" ? "github-light" : "github-dark";
}
function decodeCSS(css: string) {
  return css.replace(/\\n/g, "\n");
}

export function AppearanceCustomCSS(props: AppearancePaneProps) {
  const [themeClass, setThemeClass] = useState("");
  const editorRef = useRef<PrismEditor | null>(null);
  const storedCSS = decodeCSS(props.initial.customCSS);
  // Show changes made elsewhere (e.g. undo in the project window). Skip them
  // while typing here: those are this editor's own changes coming back, and
  // can trail behind what's been typed.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.value === storedCSS) return;
    if (editor.focused && document.hasFocus()) return;
    editor.setOptions({ value: storedCSS });
  }, [storedCSS]);
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      const theme = (await getCurrentWindow().theme()) || "light";
      const editor = basicEditor("#css-editor", {
        language: "css",
        theme: getEditorTheme(theme),
        value: storedCSS,
        onUpdate: (value) => {
          // Compare with the latest value here (which includes changes still
          // on their way to the project window), so showing a value from
          // elsewhere isn't sent back as a change
          const current = getStore().project.settings.appearance.customCSS;
          if (value === decodeCSS(current)) return;
          // Each burst of typing is one undo step
          props.update("customCSS", value, { merge: true });
        },
      });
      editorRef.current = editor;
      setThemeClass(theme);
      unlisten = await getCurrentWindow().onThemeChanged(
        ({ payload: theme }) => {
          editor.setOptions({
            theme: getEditorTheme(theme),
          });
          setThemeClass(theme);
        }
      );
    })();
    return () => {
      unlisten?.();
    };
  }, []);
  return (
    <>
      <p id="css-fyi">
        <a href="handler:///styling-with-css">
          Learn more about styling projects with CSS.
        </a>
      </p>
      <div id="css-editor" class={themeClass}></div>
    </>
  );
}
