import { getStore } from "./store";

export function log(...args: unknown[]) {
  if (getStore().playback.logging === false) return;
  return console.log(...args);
}

export function warn(...args: unknown[]) {
  return console.warn(...args);
}

export function error(...args: unknown[]) {
  return console.error(...args);
}
