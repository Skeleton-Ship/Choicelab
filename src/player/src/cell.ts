import { Cell, Action } from "./typings-project";
import { runEvents } from "./events";
import { getSettings } from "./settings";
import { getStore } from "./store";
import { action as textAction } from "./actions/text";
import { action as imageAction } from "./actions/image";
import { action as buttonAction } from "./actions/button";
import { action as audioAction } from "./actions/audio";
import { action as videoAction } from "./actions/video";
import { action as silenceAction } from "./actions/silence";
import { action as backgroundAudioAction } from "./actions/backgroundAudio";
import { action as backgroundVideoAction } from "./actions/backgroundVideo";
import { action as endBackgroundAudioAction } from "./actions/endBackgroundAudio";
import { action as endBackgroundVideoAction } from "./actions/endBackgroundVideo";
import { log, error } from "./logging";
import { navigate } from "./navigation";
import { enqueueMedia, clearMediaItems, forceEndMedia } from "./media";
import { recordHistoryPoint } from "./history";
import { getActionTiming } from "./media/actionTiming";
import { forceReflow } from "./utils/forceReflow";
import { cleanupStaleLookaheads, preloadLookaheadVideos } from "./lookahead";

const actionDefs = {
  text: textAction,
  image: imageAction,
  button: buttonAction,
  silence: silenceAction,
  audio: audioAction,
  video: videoAction,
  backgroundAudio: backgroundAudioAction,
  backgroundVideo: backgroundVideoAction,
  endBackgroundAudio: endBackgroundAudioAction,
  endBackgroundVideo: endBackgroundVideoAction,
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function getAction(cell: Cell, actionId: string): Action | false {
  let action: Action | false = false;
  cell.actions.forEach((thisAction: Action) => {
    if (thisAction.id === actionId) {
      action = thisAction;
    }
  });
  return action;
}

export async function runCell(cell: Cell) {
  const store = getStore();
  //
  // Clear screen from previous cell
  //
  const settings = getSettings(cell);
  if (settings) {
    if (settings.navigationPoint === true) {
      clearStage(settings.transitionTime * 1000);
      clearMediaItems(settings.transitionTime * 1000);
    }
    await delay(settings.transitionTime * 1000);
  }

  //
  // After previous cell has cleared, run the current cell
  //

  // Prevent cell from playing twice
  if (store.playback.currentCell === cell.id) return;
  store.playback.currentCell = cell.id;

  // Remove lookahead elements that belong to branches not taken
  cleanupStaleLookaheads(cell);
  if (settings && settings.navigationPoint === true)
    recordHistoryPoint(cell.id);
  log("Playing cell:", cell);

  // Fire actions
  const queuedActions: Array<Action> = []; // timed actions that haven't rendered yet
  const renderedActions: { [key: string]: boolean } = {}; // actions that have rendered but aren't complete
  const completedActions: { [key: string]: boolean } = {}; // actions that are fully complete
  let cellEnded = false;

  function runAction(action: Action) {
    // @ts-ignore
    if (!actionDefs[action.name]) {
      error(`No action found for ${action.name}`, action);
      return;
    }
    // @ts-ignore
    const actionFn = actionDefs[action.name].render;
    if (!actionFn) {
      error(`No render function found for ${action.name}`, action);
      return;
    }
    actionFn(action, (props?: { forceEnd: boolean }) => {
      if (props && props.forceEnd === true) {
        if (cellEnded) return;
        cellEnded = true;
        clearInterval(checkCellDone);
        clearInterval(mediaInterval);
        forceEndMedia();
        endCell(cell);
        return;
      }
      completedActions[action.id] = true;
    });
    renderedActions[action.id] = true;
  }

  function clearAction(action: Action) {
    // @ts-ignore
    const actionFn = actionDefs[action.name].clear;
    if (!actionFn) return;
    actionFn(action);
  }

  // Run standalone actions
  cell.actions.forEach((action) => {
    if (!action.enabled) return;
    renderedActions[action.id] = false;
    completedActions[action.id] = false;
    // If action is timed, queue it
    const timing = getActionTiming(action, cell);
    if (timing) {
      queuedActions.push(action);
      return;
    }
    runAction(action);
  });

  // Play media, run timed actions
  const media = store.playback.media;
  let mediaInterval = setInterval(() => {
    const completedActionsList = Object.keys(completedActions);
    completedActionsList.forEach((actionId) => {
      const action = getAction(cell, actionId);
      if (!action) return;
      const timing = getActionTiming(action, cell);
      if (!timing || !media.currentItem) return;
      if (media.currentItem.id === timing.parentId) {
        if (
          media.currentItem.el.currentTime < timing.start &&
          renderedActions[action.id] === true
        ) {
          clearAction(action);
          renderedActions[action.id] = false;
          completedActions[action.id] = false;
        }
      }
    });
    queuedActions.forEach((action) => {
      const timing = getActionTiming(action, cell);
      if (!timing || !media.currentItem) return;
      if (media.currentItem.id === timing.parentId) {
        if (
          media.currentItem.el.currentTime > timing.start &&
          renderedActions[action.id] === false
        ) {
          runAction(action);
        }
      }
    });
  }, 50);

  // Enqueue first media
  if (media.items.length > 0) {
    enqueueMedia(media.items[0].id);
  }

  // Pre-insert hidden video elements for the next possible cell(s)
  preloadLookaheadVideos(cell);

  // Check if cell is done
  const checkCellDone = setInterval(() => {
    let isCellDone = true;
    const actionKeys = Object.keys(completedActions);
    actionKeys.forEach((key: string) => {
      const actionState = completedActions[key];
      if (actionState === false) {
        isCellDone = false;
      }
    });
    if (isCellDone === true) {
      clearInterval(checkCellDone);
      if (mediaInterval) {
        clearInterval(mediaInterval);
      }
      // Fully end cell
      endCell(cell);
    }
  }, 25);

  // Force reflow
  forceReflow();
}

function clearStage(timeout: number) {
  const store = getStore();
  const topEls = store.playback.rootEl.querySelectorAll(".cl-stage .grid *");
  topEls.forEach((topEl) => {
    topEl.classList.add("clear");
    setTimeout(() => {
      topEl.parentNode?.removeChild(topEl);
    }, timeout);
  });
}

function endCell(cell: Cell) {
  navigate(cell);
  runEvents("cellDone");
}
