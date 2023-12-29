import { Rule, Stem, Branch } from "../../../typings";

export default function RuleInstance(props: {
  rule: Rule;
  stem: Stem;
  branch: Branch;
  update: Function;
}) {
  return <li class="rule">{props.rule.id}</li>;
}
