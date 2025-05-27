/*
 * Make an element resizable, if it has a .resizer element in it
 */
export function makeResizable(el: HTMLDivElement) {
  const resizer = el.querySelector(".resizer");
  if (!resizer) return;

  resizer.addEventListener("mousedown", () => {
    initDrag();
    // Lock iframe
    const iframe = el.querySelector("iframe") as HTMLIFrameElement | null;
    if (iframe) iframe.style.pointerEvents = "none";
  });

  function initDrag() {
    window.addEventListener("mousemove", doDrag, false);
    window.addEventListener("mouseup", stopDrag, false);
  }

  function doDrag(e: MouseEvent) {
    const resizer = el.querySelector(".resizer");
    if (!resizer) return;
    if (resizer.classList.contains("horizontal")) {
      el.style.width = window.innerWidth - e.clientX + "px";
    } else {
      let toolbarHeight = 0;
      const toolbar = document.querySelector("#toolbar");
      if (toolbar) {
        const toolbarStyle = window.getComputedStyle(toolbar);
        toolbarHeight = parseInt(toolbarStyle.getPropertyValue("height"));
      }
      el.style.height = e.clientY - toolbarHeight + "px";
    }
  }

  function stopDrag() {
    window.removeEventListener("mousemove", doDrag, false);
    window.removeEventListener("mouseup", stopDrag, false);
    // Lock iframe
    const iframe = el.querySelector("iframe") as HTMLIFrameElement | null;
    if (iframe) iframe.style.pointerEvents = "auto";
  }
}
