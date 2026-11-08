import { Action, ActionDefProp, RichText, Store, UpdateFunction } from "../../../../typings";
import { setStore } from "../../../../data/dataStore";
import { setActionProp } from "../../../../data/actionProps";
import RichTextField from "../../../richText/RichTextField";

/*
 * Inspector control for rich text props ("richText" for a single line,
 * "richTextarea" for paragraphs). Variables can be inserted by typing "{".
 */
export default function RichTextControl(props: {
  action: Action;
  propDef: ActionDefProp;
  multiline: boolean;
  initialValue: RichText;
  className: string;
  store: Store;
  update: UpdateFunction;
}) {
  const { action, propDef } = props;
  const fieldId = `action_${action.id}_${propDef.name}`;
  const labelId = `${fieldId}_label`;
  return (
    <div class={`inspector-prop text-field ${props.className}`}>
      <span class="label break-line" id={labelId}>
        {propDef.label}
      </span>
      <RichTextField
        key={fieldId}
        id={fieldId}
        labelledBy={labelId}
        value={props.initialValue}
        multiline={props.multiline}
        onCommit={(value) => {
          setActionProp(action, propDef.name, value);
          setStore(props.store);
          props.update();
        }}
        update={props.update}
      />
    </div>
  );
}
