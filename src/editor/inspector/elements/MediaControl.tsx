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
import PanelCornerTopLeft from "../../../assets/panel-images/corner-top-left.png";
import PanelCornerTopRight from "../../../assets/panel-images/corner-top-right.png";
import PanelCornerBottomLeft from "../../../assets/panel-images/corner-bottom-left.png";
import PanelCornerBottomRight from "../../../assets/panel-images/corner-bottom-right.png";
import PanelArrow from "../../../assets/panel-images/arrow.png";
import PanelSideLeft from "../../../assets/panel-images/side-left.png";
import PanelSideRight from "../../../assets/panel-images/side-right.png";
import PanelSideTop from "../../../assets/panel-images/side-top.png";
import PanelSideBottom from "../../../assets/panel-images/side-bottom.png";

function actionContainsTimedAction(action: Action, timedAction: Action) {
  if (
    typeof action.timedActions !== "undefined" &&
    action.timedActions.hasOwnProperty(timedAction.id)
  )
    return true;
  return false;
}

function setMediaSrc(
  el: HTMLVideoElement | HTMLAudioElement,
  url: string,
  iteration: number = 0,
  stateFn: Function
) {
  try {
    el.src = url;
    stateFn(url);
  } catch (e) {
    if (iteration < 1000) {
      setMediaSrc(el, url, iteration + 1, stateFn);
    } else {
      el.src = "";
    }
  }
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
  src: string;
  actionId: string;
  update: Function;
}) {
  //
  // Set up state and data
  //
  let [src, setSrc] = useState("");
  let [currentTime, setCurrentTime] = useState(0);
  let [paused, setPaused] = useState(true);
  let [actionsPaneVisible, showActionsPane] = useState(false);
  // let [focusedAction, setFocusedAction] = useState(false);
  const store = getStore();
  const action = getAction(props.actionId, store) as Action;
  const cell = getActionParent(action, store);
  console.log(action);
  if (!cell) return <></>;
  // Create loading element
  let mediaEl = (
    <span class="loading-text" aria-hidden="true">
      Loading...
    </span>
  );
  // Build media element
  const mediaRef = createRef();
  const scrubberRef = createRef();
  const actionsPaneRef = createRef();
  switch (action.name) {
    case "audio":
      mediaEl = <audio ref={mediaRef}></audio>;
      break;
    case "video":
      mediaEl = <video ref={mediaRef}></video>;
      break;
  }
  useEffect(() => {
    // Set media src
    setTimeout(() => {
      if (mediaRef.current !== null && src === "") {
        setMediaSrc(mediaRef.current, props.src, 0, setSrc);
      }
    }, 150);
  });
  // Set media listener for current time + scrubber
  useEffect(() => {
    const media = mediaRef.current;
    const scrubber = scrubberRef.current;
    media.addEventListener("playing", () => {
      setCurrentTime(media.currentTime);
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
  function toggleActionsPane(pane: HTMLDivElement) {
    if (actionsPaneVisible === false) {
      showActionsPane(true);
      pane.classList.add("active");
      setTimeout(() => {
        pane.classList.add("visible");
      }, 10);
    } else {
      pane.classList.remove("visible");
      pane.classList.add("fade-out");
      setTimeout(() => {
        showActionsPane(false);
        pane.classList.remove("active");
        pane.classList.remove("fade-out");
      }, 200);
    }
  }
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
    <div class="media-control">
      <div class="el-wrapper">
        {mediaEl}
        <div class="controls">
          <button
            class="play-button"
            onClick={() => {
              let el = mediaRef.current;
              if (el) {
                if (el.paused === true) {
                  el.play();
                  setPaused(false);
                } else {
                  el.pause();
                  setPaused(true);
                }
              }
            }}
          >
            <img src={paused === true ? PlayIcon : PauseIcon} />
          </button>
          <span class="current-time">{currentTime}</span>
          <div class="scrubber" ref={scrubberRef}>
            <div class="progress"></div>
            <div class="base"></div>
          </div>
          <button
            class="ui-button dark-mode"
            onClick={() => {
              const pane = actionsPaneRef.current;
              toggleActionsPane(pane);
            }}
          >
            Actions...
          </button>
          <div class="timeable-els panel top-right" ref={actionsPaneRef}>
            <div class="decoration">
              <div
                class="corner top-left"
                style={{ backgroundImage: `url("${PanelCornerTopLeft}")` }}
              ></div>
              <div
                class="corner top-right"
                style={{ backgroundImage: `url("${PanelCornerTopRight}")` }}
              ></div>
              <div
                class="corner bottom-left"
                style={{ backgroundImage: `url("${PanelCornerBottomLeft}")` }}
              ></div>
              <div
                class="corner bottom-right"
                style={{ backgroundImage: `url("${PanelCornerBottomRight}")` }}
              ></div>
              <div
                class="side left"
                style={{ backgroundImage: `url("${PanelSideLeft}")` }}
              ></div>
              <div
                class="side right"
                style={{ backgroundImage: `url("${PanelSideRight}")` }}
              ></div>
              <div
                class="side bottom"
                style={{ backgroundImage: `url("${PanelSideBottom}")` }}
              ></div>
              <div class="side top">
                <div
                  class="top-left"
                  style={{ backgroundImage: `url("${PanelSideTop}")` }}
                ></div>
                <div
                  class="top-right"
                  style={{ backgroundImage: `url("${PanelSideTop}")` }}
                ></div>
                <div
                  class="arrow"
                  style={{ backgroundImage: `url("${PanelArrow}")` }}
                ></div>
              </div>
            </div>
            <div class="contents">{timeableEls}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
