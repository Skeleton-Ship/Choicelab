/*
 * Force a style reflow on Safari to correct CSS Grid selectors
 */
export function forceReflow() {
  const el = document.querySelector(".cl-stage");
  if (!el) return;
  // @ts-ignore
  el.style.setProperty("--safari-hack", "1");
  requestAnimationFrame(() => {
    // @ts-ignore
    el.style.setProperty("--safari-hack", "0");
  });
}
