export default function setSequenceDimensions() {
  const sequenceEl = document.querySelector("#sequence") as HTMLElement;
  if (!sequenceEl) return;
  const sequenceEls = sequenceEl.querySelectorAll("#sequence .nodes .node *");
  let width = 0,
    height = 0;
  sequenceEls.forEach((el: Element) => {
    const rect = el.getBoundingClientRect();
    const elTop = rect.top;
    const elLeft = rect.left;
    const elWidth = rect.width;
    const elHeight = rect.height;
    const elX = elLeft + elWidth;
    if (elX > width) {
      width = elX;
    }
    const elY = elTop + elHeight;
    if (elY > height) {
      height = elY;
    }
  });
  sequenceEl.style.width = width + 50 + "px";
  sequenceEl.style.height = height + 50 + "px";
}
