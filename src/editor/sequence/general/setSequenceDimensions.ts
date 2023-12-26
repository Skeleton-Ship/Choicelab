export default function setSequenceDimensions() {
  const sequenceEl = document.querySelector("#sequence") as HTMLElement;
  const sequenceWrap = document.querySelector("#sequence-wrap") as HTMLElement;
  if (!sequenceEl || !sequenceWrap) return;
  const sequenceEls = sequenceEl.querySelectorAll("#sequence .nodes .node *");
  let width = 0,
    height = 0;
  sequenceEls.forEach((el: Element) => {
    const rect = el.getBoundingClientRect();
    const elTop = rect.top + sequenceWrap.scrollTop;
    const elLeft = rect.left + sequenceWrap.scrollLeft;
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
