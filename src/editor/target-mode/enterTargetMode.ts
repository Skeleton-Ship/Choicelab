import { getStore, setStore } from "../../data/dataStore";

export default function enterTargetMode(props: {
  origin: string;
  nodeId?: string;
  stemId?: string | undefined;
  update: Function;
}) {
  const store = getStore();
  if (!props.nodeId) {
    const selectedNode = store.selectedNodes[store.selectedNodes.length - 1];
    if (!selectedNode) return;
    props.nodeId = selectedNode.id;
  }
  const targetModeId =
    props.origin === "cell" || props.origin === "start"
      ? props.nodeId
      : props.stemId;
  if (typeof targetModeId === "undefined") {
    console.error("No target mode ID could be identified.");
    return;
  }
  store.targetMode = {
    active: true,
    origin: props.origin,
    nodeId: props.nodeId,
  };
  if (props.stemId) {
    store.targetMode.stemId = props.stemId;
  }
  setStore(store);
  props.update(false);
}
