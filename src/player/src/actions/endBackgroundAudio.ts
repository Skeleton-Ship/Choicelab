import { ActionForPlayback } from "../typings";
import { endBackgroundItem } from "../media";

const action = {
  render: (action: ActionForPlayback<"endBackgroundAudio">, done: Function) => {
    endBackgroundItem("audio", action.props.name);
    done({});
  },
};

export { action };
