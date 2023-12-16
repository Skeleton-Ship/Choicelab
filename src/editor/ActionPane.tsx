import { getStore } from "../data/dataStore";
import AvailableActions from "./actionPane/AvailableActions";
import ActionsEditor from "./actionPane/ActionsEditor";

export default function ActionPane(props: { update: Function }) {
  let contents = <></>;
  const store = getStore();
  if (store.selectedNodes.length <= 0) {
    // If no node is selected
    contents = <p class="placeholder">No Node Selected</p>;
  } else if (store.selectedNodes.length > 1) {
    // If multiple nodes are selected
    contents = <p class="placeholder">Multiple Nodes Selected</p>;
  } else {
    contents = (
      <>
        <AvailableActions update={props.update} />
        <ActionsEditor update={props.update} />
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
