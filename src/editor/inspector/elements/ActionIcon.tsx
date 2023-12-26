import { ActionDef } from "../../../typings";

export default function ActionIcon(props: { def: ActionDef }) {
  const def = props.def;
  let iconClass = "",
    iconStyle = {};
  if (def.editor) {
    iconClass = `bi-${def.editor.iconName}`;
    iconStyle = {
      backgroundColor: def.editor.iconBackgroundColor,
      color: def.editor.iconColor,
    };
  }
  return (
    <div class="action-icon" style={iconStyle}>
      <i class={iconClass}></i>
    </div>
  );
}
