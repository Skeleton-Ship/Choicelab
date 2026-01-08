import { useEffect } from "preact/hooks";
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
  useEffect(async () => {
    const theme = await getCurrentWindow().theme();
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
    const unlisten = await getCurrentWindow().onThemeChanged(
      ({ payload: theme }) => {
        editor.setOptions({
          theme: getEditorTheme(theme),
        });
      }
    );
    return () => {
      unlisten();
    };
  }, []);
  return <div id="css-editor"></div>;
}
