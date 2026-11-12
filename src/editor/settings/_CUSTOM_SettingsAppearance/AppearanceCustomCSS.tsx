import { useState, useEffect, useRef } from "preact/hooks";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { basicEditor } from "prism-code-editor/setups";
import type { PrismEditor } from "prism-code-editor";
import { getStore } from "../../../data/dataStore";
import {
  setActiveCodeEditor,
  takeExternalValueExpected,
} from "../activeCodeEditor";
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
  // can trail behind what's been typed. (Unless this window asked for it.)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.value === storedCSS) return;
    const expected = takeExternalValueExpected();
    if (editor.focused && document.hasFocus() && !expected) return;
    editor.setOptions({ value: storedCSS });
    // The editor's own undo steps were for text that's no longer there
    editor.extensions.history?.clear();
  }, [storedCSS]);
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let unmounted = false;
    (async () => {
      const theme = (await getCurrentWindow().theme()) || "light";
      // Left the pane while getting the theme
      if (unmounted) return;
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
          // Typing here means anything still on its way is an echo
          takeExternalValueExpected();
          // Each burst of typing is one undo step
          props.update("customCSS", value, { merge: true });
        },
      });
      editorRef.current = editor;
      setActiveCodeEditor(editor);
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
      unmounted = true;
      unlisten?.();
      setActiveCodeEditor(null);
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
