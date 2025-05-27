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
      let newHeight = e.clientY - toolbarHeight;
      if (newHeight < 300) newHeight = 300;
      if (newHeight > 700) newHeight = 700;
      document.documentElement.style.setProperty(
        "--preview-height",
        newHeight + "px"
      );
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
