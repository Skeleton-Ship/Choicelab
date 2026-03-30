import { getStore, getViewStore } from "../data/dataStore";
import { emit } from "@tauri-apps/api/event";
import { Store } from "../typings";
import { getCell } from "../data/getData";
import { stringify } from "../utils/stringify";
import { getProjectWindowLabel } from "../utils/getProjectWindowLabel";
import { updatePreviewFonts } from "./updatePreviewFonts";
import { resolveAssetsForPlayer } from "./resolveAssetsForPlayer";

function getPreviewId(store: Store) {
  const viewStore = getViewStore();
  const selectedNodes = viewStore.selectedNodes;
  const thisNode = selectedNodes[0];
  let previewId: string | false = false;
  if (thisNode) {
    if (thisNode.type === "cell") {
      previewId = thisNode.id;
    }
    if (thisNode.type === "branch") {
      const selectedStem = viewStore.selectedStem;
      if (selectedStem) {
        const linkedCell = getCell(selectedStem.link.to, store);
        if (linkedCell) {
          previewId = linkedCell.id;
        }
      }
    }
  }
  return previewId;
}

export async function updatePreview(includeAssets: boolean) {
  const store = getStore();
  const port = getViewStore().previewPort;
  // Update project files in Tauri
  // Resolve asset registry IDs back to filenames for the player
  const projectPath = store.projectPath;
  const playerProject = resolveAssetsForPlayer(store.project);
  emit("update-preview", {
    projectPath: projectPath,
    projectLabel: getProjectWindowLabel(projectPath),
    projectData: stringify(playerProject),
    includeAssets: includeAssets,
  });
  // Update preview fonts (skips work if font families haven't changed)
  updatePreviewFonts();
  // Get currently selected node
  const previewUrl = new URL(
    `http://localhost:${port}?time=${Date.now()}&startMediaOnLoad=false`
  );
  const previewId = getPreviewId(store);
  if (previewId !== false) {
    previewUrl.searchParams.set("start", previewId);
  }
  // Update app frame
  setTimeout(() => {
    const iframe = document.querySelector(
      "#preview-frame"
    ) as HTMLIFrameElement | null;
    if (!iframe) {
      return;
    }
    iframe.src = previewUrl.toString();
  }, 50);
}
