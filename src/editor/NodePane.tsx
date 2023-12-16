import { getStore } from "../data/dataStore";
import AvailableActions from "./nodePane/AvailableActions";
import ActionsEditor from "./nodePane/ActionsEditor";

export default function NodePane(props: { update: Function }) {
  let contents = <></>;
  const store = getStore();
  if (store.selectedNodes.length <= 0) {
    // If no node is selected
    contents = <p class="placeholder">No Node Selected</p>;
  } else if (store.selectedNodes.length > 1) {
    // If multiple nodes are selected
    contents = <p class="placeholder">Multiple Nodes Selected</p>;
  } else {
    const node = store.selectedNodes[0];
    if (node.type === "cell") {
      contents = (
        <>
          <AvailableActions update={props.update} />
          <ActionsEditor update={props.update} />
        </>
      );
    } else if (node.type === "branch") {
      contents = <p class="placeholder">Branch editor goes here</p>;
    }
  }
  return (
    <div id="action-pane" class="pane right">
      <div class="resizer"></div>
      {contents}
    </div>
  );
}
