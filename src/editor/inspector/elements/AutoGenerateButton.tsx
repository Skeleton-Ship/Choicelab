import { AutoGenerationPlan, getAutoGenerateLabel } from "../../../data/autoGenerate";

interface Props {
  plan: AutoGenerationPlan | null;
  context: "cell" | "branch";
}

export function AutoGenerateButton({ plan, context }: Props) {
  if (!plan) return null;
  return (
    <li class="node-setting auto-generate">
      <button class="ui-button small" onClick={() => {}}>
        {getAutoGenerateLabel(plan, context)}
      </button>
    </li>
  );
}
