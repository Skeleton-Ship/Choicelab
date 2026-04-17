import { AutoGenerationPlan, getAutoGenerateLabel } from "../../../data/autoGenerate";

interface Props {
  plan: AutoGenerationPlan | null;
  context: "cell" | "branch";
  onApply: () => void;
}

export function AutoGenerateButton({ plan, context, onApply }: Props) {
  if (!plan) return null;
  return (
    <li class="node-setting auto-generate">
      <button class="ui-button small" onClick={onApply}>
        {getAutoGenerateLabel(plan, context)}
      </button>
    </li>
  );
}
