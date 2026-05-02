import { getStore } from "./store";

export function log(...args: any) {
  if (getStore().playback.logging === false) return;
  return console.log(...args);
}

export function warn(...args: any) {
  return console.warn(...args);
}

export function error(...args: any) {
  return console.error(...args);
}
