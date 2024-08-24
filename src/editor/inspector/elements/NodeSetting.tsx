import { Cell, Branch } from "../../../typings";

export function NodeSetting(props: {
  node: Cell | Branch;
  playerId: string;
  def: { [key: string]: any };
  update: Function;
}) {
  console.log(props.node, props.def);
  return <li class="node-setting">Node setting</li>;
}
