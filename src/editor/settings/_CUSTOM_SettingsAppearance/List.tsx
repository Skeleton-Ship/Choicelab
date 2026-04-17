import { useEffect } from "preact/hooks";
import { getFocusedRegion } from "../../../utils/focusedRegion";

export function AppearanceList(props: { pane: string; setPane: Function }) {
  useEffect(() => {
    window.addEventListener(
      "keydown",
      (e) => {
        if (getFocusedRegion() !== "appearance-list") return;
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
  });
  function switchButton(dir: "up" | "down") {
    let nextIndex = dir === "up" ? -1 : 1;
    const buttons = Array.from(
      document.querySelectorAll("#appearance-list button")
    );
    buttons.forEach((button, i) => {
      const thisPane = button.getAttribute("data-pane");
      if (thisPane === props.pane) {
        let nextPane = buttons[i + nextIndex];
        if (!nextPane) {
          if (dir === "down") nextPane = buttons[0];
          if (dir === "up") nextPane = buttons[buttons.length - 1];
        }
        (nextPane as HTMLElement).focus();
        const nextPaneName = nextPane.getAttribute("data-pane");
        if (nextPaneName) {
          props.setPane(nextPaneName);
        }
      }
    });
  }
  return (
    <ul id="appearance-list">
      <li>
        <button
          data-pane="text"
          class={props.pane === "text" ? "selected" : ""}
          onClick={() => {
            props.setPane("text");
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
          class={props.pane === "inputs" ? "selected" : ""}
          onClick={() => {
            props.setPane("inputs");
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
          class={props.pane === "background" ? "selected" : ""}
          onClick={() => {
            props.setPane("background");
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
          class={props.pane === "custom-css" ? "selected" : ""}
          onClick={() => {
            props.setPane("custom-css");
          }}
        >
          <span class="icon">
            <i class="bi-braces"></i>
          </span>
          <span class="label">Custom CSS</span>
        </button>
      </li>
    </ul>
  );
}
