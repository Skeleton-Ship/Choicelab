import canAutoplay from "can-autoplay";
import { events } from "./events";
import { error } from "./logging";
import { getSequenceStart, getNode, navigate } from "./navigation";
import { initHistory } from "./history";
import { createMediaControls } from "./media/mediaControls";
import { initCaptionContainer } from "./captions";
import { dirname } from "./utils/path";
import { forceReflow } from "./utils/forceReflow";
import { generateAppearanceCSS } from "./appearance";
import { enableAutoplay, registerAutoplayQualifier } from "./autoplay";

function Choicelab() {
  return {
    init: (props: any) => {
      // When running inside the editor iframe, prevent bare Backspace/Delete
      // from triggering WKWebView's built-in back-navigation.
      if (new URLSearchParams(window.location.search).get("startMediaOnLoad") === "false") {
        document.addEventListener("keydown", (e) => {
          if ((e.key === "Backspace" || e.key === "Delete") && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const target = e.target as Element;
            const isEditable =
              target instanceof HTMLInputElement ||
              target instanceof HTMLTextAreaElement ||
              (target as HTMLElement).isContentEditable;
            if (!isEditable) e.preventDefault();
          }
        }, true);
      }
      // Fetch files
      const filePath = props.path.trim().replace(/\/+$/g, "");
      fetch(filePath)
        .then((response) => {
          return response.json();
        })
        .then((json) => {
          const isAppPreview =
            new URLSearchParams(window.location.search).get(
              "startMediaOnLoad"
            ) === "false";
          const rememberHistory =
            !isAppPreview &&
            json.settings?.player?.["choicelab-player-html5"]
              ?.rememberHistory === true;
          window.__CHOICELAB__ = {
            project: json,
            playback: {
              variables: {
                items: [],
              },
              events: events,
              currentCell: "",
              rootEl: props.root,
              actionWrappers: {},
              logging: props.logging,
              history: {
                rememberHistory,
                points: [],
                cursor: -1,
              },
              media: {
                autoplay: false,
                currentItem: false,
                playing: false,
                scrubber: {
                  interval: undefined,
                  tapEvent: undefined,
                },
                items: [],
                pendingBackgroundMedia: [],
              },
              backgroundAudio: {},
              backgroundVideo: {},
            },
          };
          // Enable autoplay immediately if the browser permits it, unless the
          // host has requested deferred autoplay (e.g. editor preview context)
          const startMediaOnLoad =
            new URLSearchParams(window.location.search).get(
              "startMediaOnLoad"
            ) !== "false";
          if (startMediaOnLoad) {
            canAutoplay.audio().then(({ result }) => {
              if (result) enableAutoplay();
            });
          }
          // Unlock autoplay on first user interaction regardless of startMediaOnLoad
          document.addEventListener("click", () => enableAutoplay(), {
            once: true,
          });
          // Add starting values to variables
          const playbackVars = window.__CHOICELAB__.playback.variables;
          window.__CHOICELAB__.project.variables.items.forEach((thisVar) => {
            let startingValue: any;
            switch (thisVar.varType) {
              case "string":
                if (typeof thisVar.startingValue === "undefined") {
                  startingValue = "";
                } else {
                  startingValue = thisVar.startingValue;
                }
                break;
              case "number":
                if (typeof thisVar.startingValue === "undefined") {
                  startingValue = NaN;
                } else {
                  startingValue = thisVar.startingValue;
                }
                break;
              case "boolean":
                if (typeof thisVar.startingValue === "undefined") {
                  startingValue = true;
                } else {
                  startingValue = thisVar.startingValue;
                }
                break;
            }
            playbackVars.items.push({
              id: thisVar.id,
              type: thisVar.varType,
              name: thisVar.name,
              value: startingValue,
            });
          });
          // Add parent cell IDs to actions
          // Why mutate? It lets the player access an action's parent cell from the action renderer (which is awfully useful), without requiring that we hardcode the value in the project JSON (which would introduce redundancy and potential for gnarly errors).
          window.__CHOICELAB__.project.sequences.forEach((sequence) => {
            sequence.nodes.forEach((node) => {
              const id = node.id;
              if (!node.actions) return;
              node.actions.forEach((action) => {
                // @ts-ignore
                action.cellId = id;
              });
            });
          });
          // Set project path
          window.__CHOICELAB__.project.projectPath = dirname(filePath);
          // Create stage
          const appWrapper = document.createElement("div");
          appWrapper.classList.add("cl-stage");
          props.root.appendChild(appWrapper);
          // Create media layer
          const bgLayer = document.createElement("div");
          bgLayer.classList.add("cl-background");
          props.root.appendChild(bgLayer);
          // Create persist layer for background media that survives cell transitions
          const persistLayer = document.createElement("div");
          persistLayer.classList.add("cl-persist-layer");
          props.root.appendChild(persistLayer);
          // Create media controls
          const mediaControls = createMediaControls();
          const playButton = mediaControls.querySelector(
            ".play.button"
          ) as HTMLElement;
          if (playButton) registerAutoplayQualifier(playButton);
          initCaptionContainer(props.root);
          props.root.appendChild(mediaControls);
          // Set appearance based on project settings
          const appearance =
            json.settings?.player?.["choicelab-player-html5"]?.appearance;
          if (appearance) {
            const projectPath = window.__CHOICELAB__.project.projectPath;
            const appearanceCSS = generateAppearanceCSS(
              appearance,
              projectPath
            );
            const styleEl = document.createElement("style");
            styleEl.textContent = appearanceCSS;
            document.head.appendChild(styleEl);
          }
          // Set starting sequence
          const restoredCellId = initHistory();
          const startingSequence = json.sequences[0];
          const startOverride = new URLSearchParams(window.location.search).get(
            "start"
          );
          const startingNode =
            restoredCellId && !startOverride
              ? getNode(restoredCellId) || getSequenceStart(startingSequence)
              : getSequenceStart(startingSequence);
          if (!startingNode) {
            error("No starting node found in this sequence:", startingSequence);
          } else if (startingNode.type !== "start") {
            navigate(startingNode, true);
          } else {
            navigate(startingNode);
          }
          // Trigger reflow on resize
          window.addEventListener("resize", forceReflow);
          // Scale content to the constrained box width
          const aspectRatio =
            json.settings?.player?.["choicelab-player-html5"]?.appearance
              ?.aspectRatio ?? "16/9";
          const DESIGN_WIDTHS: Record<string, number> = {
            "16/9": 1280,
            "1/1": 960,
            "9/16": 720,
          };
          const designWidth = DESIGN_WIDTHS[aspectRatio] ?? 1280;
          new ResizeObserver(([entry]) => {
            document.documentElement.style.setProperty(
              "--cl-scale",
              (entry.contentRect.width / designWidth).toFixed(4)
            );
          }).observe(props.root);
        }); // promise from file path
    }, // init
  }; // return
}

export default Choicelab;

// Make Choicelab available globally for non-module usage
// @ts-ignore
window.Choicelab = Choicelab;
