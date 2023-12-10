export default function inTextElement() {
  const activeEl: any = document.activeElement;
  const tagName = activeEl.tagName.toLowerCase();
  let inTextElement = false;
  if (
    tagName === "input" ||
    tagName === "textarea" ||
    activeEl.hasAttribute("contenteditable")
  ) {
    inTextElement = true;
  }
  return inTextElement;
}
