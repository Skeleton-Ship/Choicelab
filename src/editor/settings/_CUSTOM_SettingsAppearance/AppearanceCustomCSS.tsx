import { useState, useEffect } from "preact/hooks";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { basicEditor } from "prism-code-editor/setups";
import "prism-code-editor/prism/languages/markup";

function getEditorTheme(theme: "light" | "dark") {
  return theme === "light" ? "github-light" : "github-dark";
}
export function AppearanceCustomCSS(props: {
  initial: any;
  update: (key: string, newValues: { [key: string]: any }) => void;
}) {
  const [themeClass, setThemeClass] = useState("");
  useEffect(async () => {
    const theme = await getCurrentWindow().theme() || "light";
    // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
    const decoded = props.initial.customCSS.replace(/\\n/g, "\n");
    const editor = basicEditor("#css-editor", {
      language: "css",
      theme: getEditorTheme(theme),
      value: decoded,
      onUpdate: () => {
        props.update("customCSS", {
          css: editor.value,
        });
      },
    });
    setThemeClass(theme);
    const unlisten = await getCurrentWindow().onThemeChanged(
      ({ payload: theme }) => {
        editor.setOptions({
          theme: getEditorTheme(theme),
        });
        setThemeClass(theme);
      }
    );
    return () => {
      unlisten();
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
