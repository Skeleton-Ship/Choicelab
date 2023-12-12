export default function setSequenceHeight() {
  const sequenceEl = document.querySelector("#sequence");
  if (!sequenceEl) return;
  const sequenceEls = sequenceEl.querySelectorAll("#sequence *");
  let height = 0;
  sequenceEls.forEach((el: Element) => {
    // @ts-ignore
    const elHeight = el.offsetTop + el.offsetHeight;
    if (elHeight > height) {
      height = elHeight;
    }
  });
  // @ts-ignore
  sequenceEl.style.height = height + 50 + "px";
}
