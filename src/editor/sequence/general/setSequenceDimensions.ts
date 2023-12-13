export default function setSequenceDimensions() {
  const sequenceEl = document.querySelector("#sequence");
  if (!sequenceEl) return;
  const sequenceEls = sequenceEl.querySelectorAll("#sequence .nodes .node");
  let width = 0,
    height = 0;
  sequenceEls.forEach((el: Element) => {
    // @ts-ignore
    const elWidth = el.offsetLeft + el.offsetWidth;
    if (elWidth > width) {
      width = elWidth;
    } // @ts-ignore
    const elHeight = el.offsetTop + el.offsetHeight;
    if (elHeight > height) {
      height = elHeight;
    }
  });
  // @ts-ignore
  sequenceEl.style.width = width + 50 + "px";
  // @ts-ignore
  sequenceEl.style.height = height + 50 + "px";
}
