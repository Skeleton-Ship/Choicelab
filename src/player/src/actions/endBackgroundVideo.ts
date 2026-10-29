import { ActionForPlayback } from "../typings";
import { endBackgroundItem } from "../media";

const action = {
  render: (action: ActionForPlayback<"endBackgroundVideo">, done: Function) => {
    endBackgroundItem("video", action.props.name);
    done({});
  },
};

export { action };
