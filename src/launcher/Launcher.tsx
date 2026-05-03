import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useState, useEffect } from "preact/hooks";
import { emit } from "@tauri-apps/api/event";
import newProject from "../fs/newProject";
import openProject from "../fs/openProject";
import { NewProjectIcon, OpenProjectIcon } from "../editor/shared/ColorIcon";
import { showReleaseNotes } from "../utils/showReleaseNotes";
import LogoSvg from "../assets/launcher/Logo-Text.svg?react";
import Splash from "../assets/launcher/Splash.png";
import SplashDark from "../assets/launcher/Splash-DarkMode.png";

const appWindow = getCurrentWebviewWindow();

function Launcher() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    appWindow.theme().then((thisTheme) => {
      if (!thisTheme) return;
      setTheme(thisTheme);
    });
    emit("window-ready", {
      label: "launcher",
    });
    const unlistenQuit = appWindow.listen<{ label: string }>("menu-request-quit", (event) => {
      if (event.payload.label !== appWindow.label) return;
      appWindow.close();
    });
    showReleaseNotes();
    let unlisten: (() => void) | null = null;
    appWindow
      .onThemeChanged(({ payload: theme }) => {
        setTheme(theme);
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => {
      unlistenQuit.then((fn) => fn());
      if (unlisten) unlisten();
    };
  }, []);
  return (
    <div id="launcher" data-tauri-drag-region>
      <figure>
        <img src={theme === "dark" ? SplashDark : Splash} />
      </figure>
      <div className="contents">
        <h1>
          <LogoSvg />
        </h1>
        <div class="buttons">
          <button
            className="ui-button x-large"
            onClick={() => {
              newProject("launcher");
            }}
          >
            <NewProjectIcon size={24} />
            New...
          </button>
          <button className="ui-button x-large" onClick={openProject}>
            <OpenProjectIcon size={24} />
            Open...
          </button>
        </div>
        <aside id="alpha-alert">
          <span class="icon">⚠️</span>
          <p>
            Choicelab is <strong>alpha software</strong>, so make sure you save
            your work frequently.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default Launcher;
