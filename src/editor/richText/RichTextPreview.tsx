import { RichText } from "../../typings";
import { getStore } from "../../data/dataStore";
import { getVariable } from "../../data/getData";

/*
 * Compact, read-only rich text for the flowchart: paragraphs and line breaks
 * become spaces, and variables show by name.
 */
export default function RichTextPreview(props: { value: RichText }) {
  const store = getStore();
  const parts: preact.JSX.Element[] = [];
  props.value.forEach((block, blockIndex) => {
    if (blockIndex > 0) parts.push(<> </>);
    block.children.forEach((child) => {
      if (child._type === "span") {
        parts.push(<>{child.text.replace(/\n/g, " ")}</>);
        return;
      }
      const variable = getVariable(child.variableId, store);
      if (!variable) return;
      parts.push(
        <span key={child._key} class="fc-variable">
          {variable.name}
        </span>
      );
    });
  });
  return <>{parts}</>;
}
