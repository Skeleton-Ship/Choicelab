import { useEffect, useState } from "preact/hooks";
import { getStore } from "../../../data/dataStore";
import { AppearanceText } from "./AppearanceText";
import { AppearanceInputs } from "./AppearanceBackground";
import { AppearanceBackground } from "./AppearanceInputs";
import { AppearanceCustomCSS } from "./AppearanceCustomCSS";
import { getPlayerConfig } from "../../../player/getPlayerConfig";

export function SettingsAppearance() {
  const store = getStore();
  const [pane, setPane] = useState("text");
  const settings =
    store.project.settings.player[getPlayerConfig().id]["appearance"];
  function switchButton(dir: "up" | "down") {
    let nextIndex = dir === "up" ? -1 : 1;
    const buttons = Array.from(
      document.querySelectorAll("#appearance-list button")
    );
    buttons.forEach((button, i) => {
      const thisPane = button.getAttribute("data-pane");
      if (thisPane === pane) {
        let nextPane = buttons[i + nextIndex];
        if (!nextPane) {
          if (dir === "down") nextPane = buttons[0];
          if (dir === "up") nextPane = buttons[buttons.length - 1];
        }
        const nextPaneName = nextPane.getAttribute("data-pane");
        if (nextPaneName) {
          setPane(nextPaneName);
        }
      }
    });
  }
  useEffect(() => {
    window.addEventListener(
      "keydown",
      (e) => {
        switch (e.key) {
          case "ArrowDown":
            switchButton("down");
            break;
          case "ArrowUp":
            switchButton("up");
            break;
        }
      },
      { once: true }
    );
  }, [pane]);
  return (
    <>
      <ul id="appearance-list">
        <li>
          <button
            data-pane="text"
            class={pane === "text" ? "selected" : ""}
            onClick={() => {
              setPane("text");
            }}
          >
            <span class="icon">
              <i class="bi-text-left"></i>
            </span>
            <span class="label">Text</span>
          </button>
        </li>
        <li>
          <button
            data-pane="inputs"
            class={pane === "inputs" ? "selected" : ""}
            onClick={() => {
              setPane("inputs");
            }}
          >
            <span class="icon">
              <i class="bi-three-dots"></i>
            </span>
            <span class="label">Inputs</span>
          </button>
        </li>
        <li>
          <button
            data-pane="background"
            class={pane === "background" ? "selected" : ""}
            onClick={() => {
              setPane("background");
            }}
          >
            <span class="icon">
              <i class="bi-flower1"></i>
            </span>
            <span class="label">Background</span>
          </button>
        </li>
        <li>
          <button
            data-pane="custom-css"
            class={pane === "custom-css" ? "selected" : ""}
            onClick={() => {
              setPane("custom-css");
            }}
          >
            <span class="icon">
              <i class="bi-braces"></i>
            </span>
            <span class="label">Custom CSS</span>
          </button>
        </li>
      </ul>
      <div id="appearance-properties">
        {pane === "text" ? (
          <AppearanceText />
        ) : pane === "inputs" ? (
          <AppearanceInputs />
        ) : pane === "background" ? (
          <AppearanceBackground />
        ) : pane === "custom-css" ? (
          <AppearanceCustomCSS />
        ) : (
          <></>
        )}
      </div>
    </>
  );
}
