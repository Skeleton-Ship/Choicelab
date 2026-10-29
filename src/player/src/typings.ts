import type {
  Project,
  ActionName,
  ActionOf,
  VariableType,
  VariableValue,
} from "../../schema/project";

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
  type: VariableType;
  value: VariableValue | undefined; // undefined when set by a button with no value chosen
}

export interface MediaItem {
  id: string;
  type: string;
  el: HTMLMediaElement;
  fn?: {
    play: Function;
    pause: Function;
  };
  buildIn?: string;
  buildOut?: string;
}

export interface HistoryPoint {
  cellId: string;
  vars: Array<{ id: string; value: PlaybackVar["value"] }>;
}

export interface Store {
  project: ProjectStore;
  playback: {
    // Running inside the editor's preview pane
    isAppPreview: boolean;
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
      items: Array<MediaItem>;
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

// Actions are given their parent cell's ID when the project loads (see main.ts)
export type ActionForPlayback<N extends ActionName = ActionName> =
  N extends ActionName ? ActionOf<N> & { cellId: string } : never;

declare global {
  interface Window {
    __CHOICELAB__: Store;
    webkitAudioContext?: typeof AudioContext; // Safari before 14.1
  }
}

