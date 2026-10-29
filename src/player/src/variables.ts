import { getStore } from "./store";
import { PlaybackVar } from "./typings";

export function setVariable(varId: string, valueToSet: PlaybackVar["value"]) {
  const store = getStore();
  const variables = store.playback.variables;
  variables.items.forEach((variable: PlaybackVar) => {
    if (variable.id === varId) {
      variable.value = valueToSet;
    }
  });
}
