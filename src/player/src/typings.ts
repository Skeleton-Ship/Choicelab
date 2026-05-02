import { Project, Action } from "./typings-project";

export interface ProjectStore extends Project {
  projectPath: string;
}

export interface Event {
  name: string;
  fn: Function;
  once: boolean;
}

export interface PlaybackVar {
  name: string;
  id: string;
  type: string;
  value: any;
}

export interface MediaItem {
  id: string;
  type: string;
  el?: any;
  fn?: {
    play: Function;
    pause: Function;
  };
  buildIn?: string;
  buildOut?: string;
}

export interface HistoryPoint {
  cellId: string;
  vars: Array<{ id: string; value: any }>;
}

export interface Store {
  project: ProjectStore;
  playback: {
    variables: { items: Array<PlaybackVar> };
    history: {
      rememberHistory: boolean;
      points: Array<HistoryPoint>;
      cursor: number;
    };
    actionWrappers: {
      [key: string]: Element;
    };
    media: {
      autoplay: boolean;
      currentItem: MediaItem | false;
      playing: boolean;
      scrubber: {
        interval: number | undefined;
        tapEvent: void | undefined;
      };
      items: Array<{
        id: string;
        type: string;
        el?: any;
        fn?: {
          play: Function;
          pause: Function;
        };
      }>;
      pendingBackgroundMedia: HTMLMediaElement[];
    };
    backgroundAudio: Record<string, HTMLAudioElement>;
    backgroundVideo: Record<string, HTMLVideoElement>;
    logging: boolean;
    events: { [key: string]: Array<Event> };
    currentCell: string;
    rootEl: Element;
  };
}

export interface ActionForPlayback extends Action {
  extendedProps: { [key: string]: any };
  cellId: string;
}

declare global {
  interface Window {
    __CHOICELAB__: Store;
    webkitAudioContext: any;
  }
}

