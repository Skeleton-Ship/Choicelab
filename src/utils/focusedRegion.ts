function getElementRegion(targetEl: Element): string {
  let region = "";
  // Iterate through regions
  const regions = [
    "#toolbar",
    "#sequence-wrap",
    "#available-actions",
    "#actions-editor",
  ];
  regions.forEach((regionName) => {
    const parent = document.querySelector(regionName);
    if (parent) {
      if (parent === targetEl || parent.contains(targetEl)) {
        if (regionName === "#sequence-wrap") {
          region = "sequence";
        } else {
          region = regionName.substring(1);
        }
      }
    }
  });
  return region;
}

function setFocusedRegion(targetEl: Element) {
  const region = getElementRegion(targetEl);
  const app = document.querySelector("#App");
  if (!app) return;
  app.setAttribute("data-focused-region", region);
}

function getFocusedRegion(): string {
  const app = document.querySelector("#App");
  if (!app) return "";
  return app.getAttribute("data-focused-region") || "";
}

export { setFocusedRegion, getFocusedRegion };
