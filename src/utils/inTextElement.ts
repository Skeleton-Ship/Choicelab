export default function inTextElement() {
  console.log("Detecting text element...");
  const activeEl: Element | null = document.activeElement;
  if (activeEl === null) return false;
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
