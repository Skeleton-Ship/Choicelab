import { useEffect, useState } from "preact/hooks";
import { getStore, getViewStore, setViewStore } from "../../data/dataStore";
import { getBranch } from "../../data/getData";
import { Branch, Stem } from "../../typings";
import StemInstance from "./elements/StemInstance";
import internalActionDefs from "./functions/internalActionDefs";
import {
  branchQualifiesForAutoGeneration,
  buildAutoGenerationPlanFromBranch,
  getAutoGenerateLabel,
  AutoGenerationPlan,
} from "../../data/autoGenerate";
import { AutoGenerateButton } from "./elements/AutoGenerateButton";
import { setMenu } from "../../menu/setMenu";

export default function BranchPane(props: { update: Function }) {
  const store = getStore(),
    viewStore = getViewStore();
  const selectedNodeId = viewStore.selectedNodes[0]?.id ?? "";
  const [plan, setPlan] = useState<AutoGenerationPlan | null>(null);

  function setAutoGenerateLabel(label: string | null) {
    const vs = getViewStore();
    vs.autoGenerateLabel = label;
    setViewStore(vs);
    setMenu();
  }

  useEffect(() => {
    setPlan(null);
    setAutoGenerateLabel(null);
    if (!selectedNodeId) return;
    const currentStore = getStore();
    const branch = getBranch(selectedNodeId, currentStore);
    if (!branch || !branchQualifiesForAutoGeneration(branch)) return;

    const controller = new AbortController();
    buildAutoGenerationPlanFromBranch(
      branch,
      currentStore,
      internalActionDefs.actions,
      controller.signal
    )
      .then((result) => {
        const resolved = result ?? null;
        setPlan(resolved);
        if (resolved) setAutoGenerateLabel(getAutoGenerateLabel(resolved, "branch"));
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("[AutoGenerate]", err);
      });

    return () => controller.abort();
  }, [selectedNodeId]);
  // 1 node is selected
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
    <>
      <ul id="branch-editor">
        <div class="inner">{editorEls}</div>
      </ul>
      <ul id="node-settings">
        <div class="inner">
          <AutoGenerateButton plan={plan} context="branch" />
        </div>
      </ul>
    </>
  );
}
