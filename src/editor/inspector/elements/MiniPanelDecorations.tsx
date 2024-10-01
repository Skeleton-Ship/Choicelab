import PanelDarkCornerTopLeft from "../../../assets/panel-images/dark/corner-top-left.png";
import PanelDarkCornerTopRight from "../../../assets/panel-images/dark/corner-top-right.png";
import PanelDarkCornerBottomLeft from "../../../assets/panel-images/dark/corner-bottom-left.png";
import PanelDarkCornerBottomRight from "../../../assets/panel-images/dark/corner-bottom-right.png";
import PanelDarkArrow from "../../../assets/panel-images/dark/arrow.png";
import PanelDarkSideLeft from "../../../assets/panel-images/dark/side-left.png";
import PanelDarkSideRight from "../../../assets/panel-images/dark/side-right.png";
import PanelDarkSideTop from "../../../assets/panel-images/dark/side-top.png";
import PanelDarkSideBottom from "../../../assets/panel-images/dark/side-bottom.png";

export function MiniPanelDecorations() {
  return (
    <div class={`decorations`}>
      <div
        class="corner top-left"
        style={{ backgroundImage: `url("${PanelDarkCornerTopLeft}")` }}
      ></div>
      <div
        class="corner top-right"
        style={{ backgroundImage: `url("${PanelDarkCornerTopRight}")` }}
      ></div>
      <div
        class="corner bottom-left"
        style={{ backgroundImage: `url("${PanelDarkCornerBottomLeft}")` }}
      ></div>
      <div
        class="corner bottom-right"
        style={{ backgroundImage: `url("${PanelDarkCornerBottomRight}")` }}
      ></div>
      <div
        class="side left"
        style={{ backgroundImage: `url("${PanelDarkSideLeft}")` }}
      ></div>
      <div
        class="side right"
        style={{ backgroundImage: `url("${PanelDarkSideRight}")` }}
      ></div>
      <div
        class="side bottom"
        style={{ backgroundImage: `url("${PanelDarkSideBottom}")` }}
      ></div>
      <div class="side top">
        <div
          class="top-left"
          style={{ backgroundImage: `url("${PanelDarkSideTop}")` }}
        ></div>
        <div
          class="top-right"
          style={{ backgroundImage: `url("${PanelDarkSideTop}")` }}
        ></div>
        <div
          class="arrow"
          style={{ backgroundImage: `url("${PanelDarkArrow}")` }}
        ></div>
      </div>
    </div>
  );
}
