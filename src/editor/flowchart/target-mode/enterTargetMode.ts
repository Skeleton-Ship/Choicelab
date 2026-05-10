import {
  getStore,
  getViewStore,
  setStore,
  setViewStore,
} from "../../../data/dataStore";
import { getActiveBranchStem } from "../../../data/getData";

export default function enterTargetMode(props: {
  origin?: string;
  nodeId?: string;
  stemId?: string | undefined;
  update: Function;
}) {
  const store = getStore(),
    viewStore = getViewStore();
  if (!props.nodeId) {
    const selectedNode =
      viewStore.selectedNodes[viewStore.selectedNodes.length - 1];
    if (!selectedNode) return;
    props.nodeId = selectedNode.id;
    props.origin = selectedNode.type;
    const selectedStem = viewStore.selectedStem;
    if (selectedStem !== false) {
      props.stemId = selectedStem.id;
      props.origin = "branchStem";
    } else if (selectedNode.type === "branch") {
      const activeStem = getActiveBranchStem(props.nodeId, store);
      if (!activeStem) return;
      props.stemId = activeStem.id;
      props.origin = "branchStem";
    }
  }
  if (!props.origin) return;
  const targetModeId =
    props.origin === "cell" || props.origin === "start"
      ? props.nodeId
      : props.stemId;
  if (typeof targetModeId === "undefined") {
    console.error("No target mode ID could be identified.");
    return;
  }
  viewStore.targetMode = {
    active: true,
    origin: props.origin,
    nodeId: props.nodeId,
  };
  if (props.stemId) {
    viewStore.targetMode.stemId = props.stemId;
  }
  setStore(store);
  setViewStore(viewStore);
  props.update(false, false);
}
