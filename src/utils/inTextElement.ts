/**
 * The focused element, looking inside shadow roots (e.g. the Custom CSS
 * editor), where document.activeElement only gives the shadow host.
 */
export function deepActiveElement(): Element | null {
  let activeEl = document.activeElement;
  while (activeEl?.shadowRoot?.activeElement) {
    activeEl = activeEl.shadowRoot.activeElement;
  }
  return activeEl;
}

/** Whether an element takes text input */
export function isTextElement(el: Element | null): boolean {
  if (el === null) return false;
  const tagName = el.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    el.hasAttribute("contenteditable")
  );
}

export default function inTextElement() {
  return isTextElement(deepActiveElement());
}
