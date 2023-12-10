/**
 * Given an HTML element, returns the offset position of the element onscreen. Because stems' X and Y positions are relative to their parent branch, it also does a bit of math to figure that out.
 *
 * @param {HTMLElement} el - The element to get the position for.
 */
export default function getElementOffset(el: HTMLElement): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const style = window.getComputedStyle(el);
  // Width and height are easy...
  const elWidth = parseInt(style.getPropertyValue("width").replace("px", ""));
  const elHeight = parseInt(style.getPropertyValue("height").replace("px", ""));
  // ...but left and top are harder...
  let elLeft = parseInt(style.getPropertyValue("left").replace("px", ""));
  let elTop = parseInt(style.getPropertyValue("top").replace("px", ""));
  // ...because stems are positioned relative to their branch, which means we have to get the width and height of the branch and factor that in
  if (el.classList.contains("stem")) {
    const branchId = el.getAttribute("data-branch");
    if (branchId) {
      const branchEl = document.querySelector(`.node[data-id="${branchId}"]`);
      if (branchEl) {
        const branchStyle = window.getComputedStyle(branchEl);
        const branchLeft = parseInt(
          branchStyle.getPropertyValue("left").replace("px", "")
        );
        const branchTop = parseInt(
          branchStyle.getPropertyValue("top").replace("px", "")
        );
        const branchWidth = parseInt(
          branchStyle.getPropertyValue("width").replace("px", "")
        );
        const branchHeight = parseInt(
          branchStyle.getPropertyValue("height").replace("px", "")
        );
        elLeft += branchLeft;
        elTop += branchTop + branchHeight / 2;
      }
    }
  }

  return {
    left: elLeft,
    top: elTop,
    width: elWidth,
    height: elHeight,
  };
}
