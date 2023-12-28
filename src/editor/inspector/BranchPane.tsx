import { getStore } from "../../data/dataStore";
import { getBranch } from "../../data/getData";
import { Branch, Stem } from "../../typings";
import StemInstance from "./elements/StemInstance";

export default function BranchPane(props: { update: Function }) {
  const store = getStore();
  // 1 node is selected
  const selectedNodeId = store.selectedNodes[0].id;
  const node: Branch | undefined = getBranch(selectedNodeId, store);
  if (!node) return <></>;
  let editorEls: Array<preact.JSX.Element> = [];
  let indexLabel = 1;
  if (node.stems.length === 1) {
    editorEls.push(<p class="placeholder">No Stems in Branch</p>);
  } else {
    node.stems.forEach((stem: Stem) => {
      if (stem.type === "noMatch") return;
      const stemKey = `action_${stem.id}`;
      editorEls.push(
        <StemInstance
          key={stemKey}
          stem={stem}
          branch={node}
          store={store}
          indexLabel={indexLabel}
          update={props.update}
        />
      );
      indexLabel++;
    });
  }
  return (
    <ul id="branch-editor">
      <div class="inner">{editorEls}</div>
    </ul>
  );
}
