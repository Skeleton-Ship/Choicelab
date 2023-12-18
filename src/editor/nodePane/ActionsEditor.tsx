import { getStore } from "../../data/dataStore";
import { getCell } from "../../data/getData";
import { Cell, Action } from "../../typings";
import ActionInstance from "./ActionInstance";

export default function ActionsEditor(props: { update: Function }) {
  const store = getStore();
  // 1 node is selected
  const selectedNodeId = store.selectedNodes[0].id;
  const node: Cell | undefined = getCell(selectedNodeId, store);
  if (!node) return <></>;
  let editorEls: Array<preact.JSX.Element> = [];
  node.actions.forEach((action: Action) => {
    const actionKey = `action_${action.id}`;
    editorEls.push(
      <ActionInstance
        instance={action}
        key={actionKey}
        store={store}
        update={props.update}
      />
    );
  });
  return (
    <ul id="actions-editor">
      <div class="inner">{editorEls}</div>
    </ul>
  );
}
