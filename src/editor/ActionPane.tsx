import { getStore } from "../data/dataStore";
import AvailableActions from "./actionPane/AvailableActions";

export default function ActionPane(props: { update: Function }) {
  let contents = <></>;
  const store = getStore();
  if (store.selectedNodes.length <= 0) {
    // If no node is selected
    contents = <p class="placeholder">No node selected</p>;
  } else if (store.selectedNodes.length > 1) {
    // If multiple nodes are selected
    contents = <p class="placeholder">Multiple nodes selected</p>;
  } else {
    // 1 node is selected
    const selectedNode = store.selectedNodes[0];
    console.log(selectedNode);
    contents = (
      <>
        <AvailableActions update={props.update} />
        <ul id="slotted-actions"></ul>
      </>
    );
  }
  return (
    <div id="action-pane" class="pane right">
      <div class="resizer"></div>
      {contents}
    </div>
  );
}
