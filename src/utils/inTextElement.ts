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

// Input types that take typed text (and so have their own undo)
const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
]);

/** Whether an element takes text input */
export function isTextElement(el: Element | null): boolean {
  if (el === null) return false;
  if (el instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(el.type);
  return el instanceof HTMLTextAreaElement || el.hasAttribute("contenteditable");
}

export default function inTextElement() {
  return isTextElement(deepActiveElement());
}
