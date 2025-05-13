import { getBranchStem } from "../../../data/getData";
import { getStore } from "../../../data/dataStore";
import { getNode } from "../../../data/getData";
import { Store, Stem, AnyNode, Link } from "../../../typings";
import enterTargetMode from "../target-mode/enterTargetMode";

/**
 * A component that lives in cells and branch stems that: 1) indicates the node the cell/stem connects to, 2) provides a means of setting the link destination.
 *
 */
export default function LinkEl(props: {
  origin: string;
  nodeId: string;
  stemId?: string;
  update: Function;
}) {
  // Get link property
  function getLinkProps(store: Store) {
    const node: AnyNode | undefined = getNode(props.nodeId, store);
    if (typeof node === "undefined") {
      console.error("Node not found.");
      return;
    }
    let link: Link | undefined;
    if (props.origin === "cell" || props.origin === "start") {
      link = node.link;
    }
    if (props.origin === "branchStem" && typeof props.stemId !== "undefined") {
      const stem: Stem | undefined = getBranchStem(
        props.stemId,
        props.nodeId,
        store
      );
      if (typeof stem === "undefined") {
        console.error("No stem found.");
        return;
      }
      link = stem.link;
    }
    return link;
  }
  // Get current to destination
  const store = getStore();
  const link = getLinkProps(store);
  let toId = link && link.to ? link.to : "";
  return (
    <div className="link">
      <button
        className="linker"
        onClick={() => {
          enterTargetMode({
            origin: props.origin,
            nodeId: props.nodeId,
            stemId: props.stemId,
            update: props.update,
          });
        }}
        tabindex={-1}
      >
        <span>Connect</span>
      </button>
      <div className="to-id">{toId}</div>
    </div>
  );
}
