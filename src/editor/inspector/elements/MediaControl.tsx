import { useState, useEffect } from "preact/hooks";
import { createRef } from "preact";
import { Action } from "../../../typings";
import PlayIcon from "../../../assets/icon-play.svg";
import PauseIcon from "../../../assets/icon-pause.svg";
import { getActionParent } from "../../../utils/getActionParent";
import { getActionDef } from "../functions/getActionDef";
import { timeableActionInUse } from "../functions/timeableActionInUse";
import { getStore, setStore } from "../../../data/dataStore";
import { getAction } from "../../../data/getData";
import { formatElapsedTime } from "../../../utils/formatElapsedTime";
import { MiniPanel } from "./MiniPanel";

function actionContainsTimedAction(action: Action, timedAction: Action) {
  if (
    typeof action.timedActions !== "undefined" &&
    action.timedActions.hasOwnProperty(timedAction.id)
  )
    return true;
  return false;
}

function setScrubberWidth(
  scrubber: HTMLDivElement,
  elapsedTime: number,
  totalTime: number
) {
  const progress = scrubber.querySelector(".progress") as HTMLDivElement;
  if (!progress) return;
  progress.style.width = (elapsedTime / totalTime) * 100 + "%";
}

export function MediaControl(props: {
  media: HTMLAudioElement | HTMLVideoElement | false;
  actionId: string;
  update: Function;
}) {
  //
  // Set up state and data
  //
  const store = getStore();
  const action = getAction(props.actionId, store) as Action;
  const cell = getActionParent(action, store);
  if (!cell || props.media === false) return <></>;
  const media = props.media as HTMLVideoElement | HTMLAudioElement;
  // Set up state
  const [currentTimeLabel, setCurrentTimeLabel] = useState("00:00.00");
  const [paused, setPaused] = useState(true);
  const [actionsPaneVisible, showActionsPane] = useState(false);
  // Set media listener for current time + scrubber
  const scrubberRef = createRef();
  useEffect(() => {
    const scrubber = scrubberRef.current;
    media.addEventListener("playing", () => {
      setCurrentTimeLabel(formatElapsedTime(media.currentTime));
      if (scrubber) {
        console.log(scrubber);
        setScrubberWidth(scrubber, media.currentTime, media.duration);
      }
    });
  }, []);
  //
  // Get timeable actions available, based on whether they're a timed element
  //
  const timeableActions: Array<{ icon: string | undefined; action: Action }> =
    [];
  cell.actions.forEach((action) => {
    const def = getActionDef(action);
    if (def && def.timedElement === true) {
      timeableActions.push({
        icon: def.editor?.iconName,
        action: action,
      });
    }
  });
  // Build the list of actions
  // NOTE: This is pretty crufty. Ideally the actions should determine what goes in the label, not this component.
  const timeableEls: Array<preact.JSX.Element> = [];
  timeableActions.forEach((timeable) => {
    const timeableAction: any = timeable.action;
    const disabled = timeableActionInUse(timeableAction, action) ? true : false;
    const key = `timeable_action_${timeableAction.id}`;
    const activeClass = actionContainsTimedAction(action, timeableAction)
      ? "active"
      : "";
    let previewText = "";
    switch (timeableAction.name) {
      case "text":
        previewText =
          timeableAction.props.contents !== ""
            ? timeableAction.props.contents
            : "Text Block";
        break;
      case "button":
        previewText =
          timeableAction.props.label !== ""
            ? timeableAction.props.label
            : "Button";
        break;
      case "image":
        previewText =
          timeableAction.props.src !== "" ? timeableAction.props.src : "Image";
        break;
      case "inputField":
        previewText =
          timeableAction.props.label !== ""
            ? timeableAction.props.src
            : "Input Field";
        break;
    }
    const timeableEl = (
      <div class={`timeable-el ${activeClass}`} key={key} disabled={disabled}>
        <span class="action-preview">
          <i class={`bi bi-${timeable.icon}`}></i>{" "}
          <span class="text">{previewText}</span>
        </span>
        <button
          disabled={disabled}
          class={`ui-toggle-button dark-mode ${activeClass}`}
          title={`Toggle timing for the ${timeableAction.name} action labeled "${previewText}"`}
          onClick={() => {
            toggleTimedAction(timeableAction);
          }}
        ></button>
      </div>
    );
    timeableEls.push(timeableEl);
  });
  function toggleTimedAction(timeableAction: Action) {
    if (!action.timedActions) {
      action.timedActions = {};
    }
    if (actionContainsTimedAction(action, timeableAction) === false) {
      action.timedActions[timeableAction.id] = {
        start: 0,
        end: -1,
      };
    } else {
      if (action.timedActions[timeableAction.id]) {
        delete action.timedActions[timeableAction.id];
      }
    }
    setStore(store);
    props.update();
  }
  return (
    <>
      <div class={`media-controls ${action.name === "video" ? "overlay" : ""}`}>
        <button
          class="play-button"
          onClick={() => {
            if (media.paused === true) {
              media.play();
              setPaused(false);
            } else {
              media.pause();
              setPaused(true);
            }
          }}
        >
          <img src={paused === true ? PlayIcon : PauseIcon} />
        </button>
        <span class="current-time">{currentTimeLabel}</span>
        <div class="scrubber" ref={scrubberRef}>
          <div class="progress"></div>
          <div class="base"></div>
        </div>
        <button
          class="small ui-button dark-mode"
          onClick={() => {
            if (actionsPaneVisible === false) {
              showActionsPane(true);
              return;
            }
            showActionsPane(false);
          }}
        >
          Actions...
        </button>
      </div>
      <MiniPanel
        visible={actionsPaneVisible}
        origin="top-right"
        className="timeable-els"
      >
        {timeableEls}
      </MiniPanel>
    </>
  );
}
