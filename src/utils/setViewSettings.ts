import { Store } from "../typings";

export default function setViewSettings(valueNum: number, store: Store) {
  const viewSettings = store.viewSettings;
  // Set width
  viewSettings.cellWidth = valueNum;
  viewSettings.cellMarginLeft = valueNum + valueNum * 0.22;
  // Set height
  const heightNum = valueNum * 0.7;
  viewSettings.cellHeight = heightNum;
  viewSettings.cellMarginTop = heightNum + valueNum;
  if (viewSettings.cellMarginTop > 500) viewSettings.cellMarginTop = 500;
  // Set stem size
  viewSettings.stemWidth = valueNum * 0.64;
  if (viewSettings.stemWidth < 100) viewSettings.stemWidth = 100;
  viewSettings.stemHeight = valueNum * 0.2;
  if (viewSettings.stemHeight < 45) viewSettings.stemHeight = 45;
  viewSettings.stemMarginLeft = viewSettings.cellWidth + 25;
  return viewSettings;
}
