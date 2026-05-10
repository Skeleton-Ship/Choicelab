import { getStore } from "./store";

function storageKey(): string {
  return `choicelab_history_${window.location.host}_${getStore().project.id}`;
}

export function initHistory(): string | null {
  const store = getStore();
  const { rememberHistory } = store.playback.history;

  if (!rememberHistory) return null;

  const saved = sessionStorage.getItem(storageKey());
  if (!saved) return null;

  try {
    const data = JSON.parse(saved) as {
      points: Array<{
        cellId: string;
        vars: Array<{ id: string; value: any }>;
      }>;
      cursor: number;
    };
    if (!data.points || data.points.length === 0) return null;

    const currentPoint = data.points[data.cursor];
    if (!currentPoint) return null;

    store.playback.history.points = data.points;
    store.playback.history.cursor = data.cursor;

    // Restore var values from the saved point
    currentPoint.vars.forEach(({ id, value }) => {
      const varItem = store.playback.variables.items.find((v) => v.id === id);
      if (varItem) varItem.value = value;
    });

    return currentPoint.cellId;
  } catch {
    return null;
  }
}

export function clearHistory() {
  sessionStorage.removeItem(storageKey());
}

export function recordHistoryPoint(cellId: string) {
  const store = getStore();
  const history = store.playback.history;

  // Skip if this cell is already the current point (e.g. navigated here via restore)
  if (history.points[history.cursor]?.cellId === cellId) return;

  const vars = store.playback.variables.items.map(({ id, value }) => ({
    id,
    value,
  }));
  history.points.push({ cellId, vars });
  history.cursor = history.points.length - 1;

  if (history.rememberHistory) {
    sessionStorage.setItem(
      storageKey(),
      JSON.stringify({ points: history.points, cursor: history.cursor })
    );
  }
}
