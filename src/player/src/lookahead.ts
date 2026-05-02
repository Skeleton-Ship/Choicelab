import { getStore } from "./store";
import { getNode } from "./navigation";
import { Cell } from "./typings-project";

const VIDEO_ACTIONS = new Set(["video", "backgroundVideo"]);

function getNextCells(cell: Cell): Cell[] {
  const nextId = cell.link?.to;
  if (!nextId) return [];
  const next = getNode(nextId);
  if (!next) return [];
  if (next.type === "cell") return [next as unknown as Cell];
  if (next.type === "branch" && next.stems) {
    return next.stems
      .map((stem) => {
        const node = stem.link?.to ? getNode(stem.link.to) : null;
        return node?.type === "cell" ? (node as unknown as Cell) : null;
      })
      .filter((c): c is Cell => c !== null);
  }
  return [];
}

// Remove lookahead elements that don't belong to the cell now being rendered.
// Called before actions run so the right elements survive to be promoted.
export function cleanupStaleLookaheads(cell: Cell) {
  const store = getStore();
  const validIds = new Set(
    cell.actions
      .filter((a) => a.enabled && VIDEO_ACTIONS.has(a.name))
      .map((a) => a.id)
  );
  store.playback.rootEl
    .querySelectorAll("[data-lookahead-id]")
    .forEach((el) => {
      const id = (el as HTMLElement).dataset.lookaheadId;
      if (!id || !validIds.has(id)) el.parentNode?.removeChild(el);
    });
}

// Pre-insert hidden video elements for the next possible cell(s) so the
// browser loads their data before the transition begins.
export function preloadLookaheadVideos(cell: Cell) {
  const store = getStore();
  const bgLayer = store.playback.rootEl.querySelector(".cl-background");
  if (!bgLayer) return;

  // Clear any leftover lookaheads from the previous cycle
  bgLayer
    .querySelectorAll("[data-lookahead-id]")
    .forEach((el) => el.parentNode?.removeChild(el));

  const nextCells = getNextCells(cell);
  nextCells.forEach((nextCell) => {
    nextCell.actions.forEach((action) => {
      if (!action.enabled || !VIDEO_ACTIONS.has(action.name)) return;
      if (!action.props.source) return;

      const src =
        store.project.projectPath + "/Assets/" + action.props.source;
      const video = document.createElement("video");
      video.setAttribute("src", src);
      video.setAttribute("playsinline", "");
      video.setAttribute("preload", "auto");
      video.classList.add("cl-lookahead");
      video.dataset.lookaheadId = action.id;
      bgLayer.appendChild(video);
    });
  });
}
