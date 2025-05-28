import { getViewStore } from "../../../data/dataStore";
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
  // Set sequence width, height
  sequenceEl.style.width = width + 50 + "px";
  sequenceEl.style.height = height + 50 + "px";
  // Set zoom class
  const zoomFactor = getViewStore().viewSettings.cellWidth;
  const viewPrefixes = ["xs", "sm", "md", "lg", "xl"];
  let viewClass = "";
  if (zoomFactor < 120) {
    viewClass = "view-xs";
  } else if (zoomFactor >= 120 && zoomFactor < 220) {
    viewClass = "view-sm";
  } else if (zoomFactor >= 220 && zoomFactor < 320) {
    viewClass = "view-md";
  } else if (zoomFactor >= 320 && zoomFactor < 420) {
    viewClass = "view-lg";
  } else if (zoomFactor >= 420) {
    viewClass = "view-xl";
  }
  viewPrefixes.forEach((className) => {
    sequenceEl.classList.remove(`view-${className}`);
  });
  sequenceEl.classList.add(viewClass);
}
