import canAutoplay from "can-autoplay";
import { events } from "./events";
import { error } from "./logging";
import { getSequenceStart, getNode, navigate } from "./navigation";
import { initHistory } from "./history";
import { createMediaControls } from "./media/mediaControls";
import { dirname } from "./utils/path";
import { forceReflow } from "./utils/forceReflow";
import { generateAppearanceCSS } from "./appearance";
import { enableAutoplay, registerAutoplayQualifier } from "./autoplay";

function Choicelab() {
  return {
    init: (props: any) => {
      // Fetch files
      const filePath = props.path.trim().replace(/\/+$/g, "");
      fetch(filePath)
        .then((response) => {
          return response.json();
        })
        .then((json) => {
          const rememberHistory = json.settings?.player?.["choicelab-player-html5"]?.rememberHistory === true;
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
              },
            },
          };
          // Enable autoplay immediately if the browser already permits it
          canAutoplay.audio().then(({ result }) => {
            if (result) enableAutoplay();
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
          // Create grid areas
          const gridZonesX = 3,
            gridZonesY = 3;
          for (let x = 0; x < gridZonesX; x++) {
            for (let y = 0; y < gridZonesY; y++) {
              const el = document.createElement("div");
              el.classList.add("grid", `x-${x + 1}`, `y-${y + 1}`);
              appWrapper.appendChild(el);
            }
          }
          props.root.appendChild(appWrapper);
          // Create media layer
          const bgLayer = document.createElement("div");
          bgLayer.classList.add("cl-background");
          props.root.appendChild(bgLayer);
          // Create media controls
          const mediaControls = createMediaControls();
          const playButton = mediaControls.querySelector(".play.button") as HTMLElement;
          if (playButton) registerAutoplayQualifier(playButton);
          props.root.appendChild(mediaControls);
          // Set appearance based on project settings
          const appearance = json.settings?.player?.["choicelab-player-html5"]?.appearance;
          if (appearance) {
            const projectPath = window.__CHOICELAB__.project.projectPath;
            const appearanceCSS = generateAppearanceCSS(appearance, projectPath);
            const styleEl = document.createElement("style");
            styleEl.textContent = appearanceCSS;
            document.head.appendChild(styleEl);
          }
          // Set starting sequence
          const restoredCellId = initHistory();
          const startingSequence = json.sequences[0];
          const startOverride = new URLSearchParams(window.location.search).get("start");
          const startingNode = (restoredCellId && !startOverride)
            ? (getNode(restoredCellId) || getSequenceStart(startingSequence))
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
        }); // promise from file path
    }, // init
  }; // return
}

export default Choicelab;

// Make Choicelab available globally for non-module usage
// @ts-ignore
window.Choicelab = Choicelab;
