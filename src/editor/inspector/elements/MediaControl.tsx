import { JSX } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { Action } from "../../../typings";
import PlayIcon from "../../../assets/icons/mono/icon-play.svg";
import PauseIcon from "../../../assets/icons/mono/icon-pause.svg";
import { getActionParent } from "../../../utils/getActionParent";
import { getActionDef } from "../functions/getActionDef";
import { timeableActionInUse } from "../functions/timeableActionInUse";
import { getStore, setStore } from "../../../data/dataStore";
import { getAction } from "../../../data/getData";
import { formatElapsedTime } from "../../../utils/formatElapsedTime";
import { MiniPanel } from "./MiniPanel";
import { getActionTextLabel } from "../functions/getActionTextLabel";
import { Waveform } from "./Waveform";
import { parseNumber } from "../../../utils/parseNumber";
import { TimingFlag } from "./TimingFlag";

function actionContainsTimedAction(
  action: Action,
  timedAction: Action
): boolean {
  return !!action.timedActions?.hasOwnProperty(timedAction.id);
}

function setScrubberWidth(
  scrubber: HTMLDivElement,
  elapsedTime: number,
  totalTime: number
) {
  const progress = scrubber.querySelector(".progress") as HTMLDivElement;
  if (!progress) return;
  progress.style.width = ((elapsedTime / totalTime) * 100).toFixed(2) + "%";
}

export function MediaControl(props: {
  media: HTMLAudioElement | HTMLVideoElement | false;
  actionId: string;
  update: Function;
}) {
  const store = getStore();
  const action = getAction(props.actionId, store);
  if (!action) return <></>;
  const cell = getActionParent(action, store);
  if (!cell || props.media === false) return <></>;

  const media = props.media;
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [currentTimeLabel, setCurrentTimeLabel] = useState("00:00.00");
  const [paused, setPaused] = useState(true);
  const [actionsPaneVisible, showActionsPane] = useState(false);

  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrubber = scrubberRef.current;
    if (!scrubber) return;

    const handlePointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      const parent = el.parentElement as HTMLElement;
      if (
        el.classList.contains("timing-flag") ||
        parent?.classList.contains("timing-flag")
      )
        return;

      const percentage = e.offsetX / scrubber.offsetWidth;
      const newTime = media.duration * percentage;
      media.currentTime = newTime;
      setCurrentTimeLabel(formatElapsedTime(media.currentTime));
      setScrubberWidth(scrubber, media.currentTime, media.duration);
    };

    const handleTimeUpdate = () => {
      if (media.paused) {
        setCurrentTimeLabel(formatElapsedTime(media.currentTime));
        setScrubberWidth(scrubber, media.currentTime, media.duration);
      }
    };

    const interval = setInterval(() => {
      if (!media.paused) {
        setCurrentTimeLabel(formatElapsedTime(media.currentTime));
        setScrubberWidth(scrubber, media.currentTime, media.duration);
      }
    }, 75);

    scrubber.addEventListener("pointerdown", handlePointerDown);
    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener(
      "loadeddata",
      () => {
        setMediaLoaded(true);
      },
      { once: true }
    );

    return () => {
      clearInterval(interval);
      scrubber.removeEventListener("pointerdown", handlePointerDown);
      media.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  const timeableActions = cell.actions
    .map((action) => {
      const def = getActionDef(action);
      return def?.timedElement ? { icon: def.editor?.iconName, action } : null;
    })
    .filter(Boolean) as Array<{ icon: string | undefined; action: Action }>;

  const timeableEls = timeableActions.map(({ icon, action: ta }) => {
    const disabled = timeableActionInUse(ta, action);
    const activeClass = actionContainsTimedAction(action, ta) ? "active" : "";
    const previewText = getActionTextLabel(ta.name, ta.props);

    return (
      <div
        class={`timeable-el ${activeClass}`}
        key={`timeable_action_${ta.id}`}
      >
        <span class="action-preview">
          <i class={`bi bi-${icon}`}></i>
          <span class="text">{previewText}</span>
        </span>
        <button
          disabled={disabled}
          class={`ui-toggle-button dark-mode ${activeClass}`}
          title={`Toggle timing for the ${ta.name} action labeled "${previewText}"`}
          onClick={() => toggleTimedAction(action, ta)}
        />
      </div>
    );
  });

  function toggleTimedAction(action: Action, timeableAction: Action) {
    action.timedActions ||= {};
    if (!actionContainsTimedAction(action, timeableAction)) {
      action.timedActions[timeableAction.id] = { start: 0, end: -1 };
    } else {
      delete action.timedActions[timeableAction.id];
    }
    setStore(store);
    props.update();
  }

  const timingFlagEls = timeableActions
    .filter(({ action: ta }) => actionContainsTimedAction(action, ta))
    .map(({ action: ta }) => {
      const label = getActionTextLabel(ta.name, ta.props);
      const timingProps = action.timedActions?.[ta.id];
      if (!timingProps) return null;
      if (!mediaLoaded) return null;
      // Get percentage from duration and start prop
      let startPercent = (timingProps.start / media.duration) * 100;
      startPercent = parseNumber(startPercent, 2);
      return (
        <TimingFlag
          key={`timing_flag_${ta.id}`}
          parentActionId={props.actionId}
          label={label}
          start={startPercent}
          onChange={(newTimes) => {
            if (!action.timedActions?.[ta.id]) return;
            // Convert percentage back into duration
            const newDuration = parseNumber(
              (media.duration * newTimes.start) / 100,
              2
            );
            action.timedActions[ta.id].start = newDuration;
            setStore(store);
            props.update();
          }}
        />
      );
    })
    .filter((el): el is JSX.Element => el !== null);

  return (
    <>
      {action.name === "audio" && (
        <Waveform el={media} actionId={props.actionId} flags={timingFlagEls} />
      )}
      <div
        class={`media-controls ${action.name} ${
          action.name === "video" ? "overlay" : ""
        }`}
      >
        <button
          class="play-button"
          onClick={() => {
            if (media.paused) {
              media.play();
              setPaused(false);
            } else {
              media.pause();
              setPaused(true);
            }
          }}
        >
          <img src={paused ? PlayIcon : PauseIcon} />
        </button>
        <span class="current-time">{currentTimeLabel}</span>
        <div class="scrubber" ref={scrubberRef}>
          {action.name === "video" ? timingFlagEls : null}
          <div class="progress"></div>
          <div class="base"></div>
        </div>
        <button
          class={`small ui-button timeable-actions-button ${
            action.name === "video" ? "dark-mode" : ""
          }`}
          onClick={() => showActionsPane(!actionsPaneVisible)}
        >
          Actions...
        </button>
      </div>
      <MiniPanel
        visible={actionsPaneVisible}
        origin="top-right"
        className={`timeable-els ${action.name}`}
      >
        {timeableEls}
      </MiniPanel>
    </>
  );
}
