import { useEffect } from "preact/hooks";
import { createRef } from "preact";
import PanelDarkCornerTopLeft from "../../../assets/panel-images/dark/corner-top-left.png";
import PanelDarkCornerTopRight from "../../../assets/panel-images/dark/corner-top-right.png";
import PanelDarkCornerBottomLeft from "../../../assets/panel-images/dark/corner-bottom-left.png";
import PanelDarkCornerBottomRight from "../../../assets/panel-images/dark/corner-bottom-right.png";
import PanelDarkArrow from "../../../assets/panel-images/dark/arrow.png";
import PanelDarkSideLeft from "../../../assets/panel-images/dark/side-left.png";
import PanelDarkSideRight from "../../../assets/panel-images/dark/side-right.png";
import PanelDarkSideTop from "../../../assets/panel-images/dark/side-top.png";
import PanelDarkSideBottom from "../../../assets/panel-images/dark/side-bottom.png";

export function MiniPanel(props: {
  visible: boolean;
  origin: string;
  className: string;
  children: preact.JSX.Element | Array<preact.JSX.Element>;
}) {
  const panelRef = createRef();
  useEffect(() => {
    if (!panelRef.current) return;
    const panel = panelRef.current;
    if (props.visible === true) {
      panel.classList.add("active");
      setTimeout(() => {
        panel.classList.add("visible");
      }, 10);
    } else {
      panel.classList.remove("visible");
      panel.classList.add("fade-out");
      setTimeout(() => {
        panel.classList.remove("active");
        panel.classList.remove("fade-out");
      }, 200);
    }
  });
  return (
    <div class={`panel ${props.origin} ${props.className}`} ref={panelRef}>
      <div class="contents">{props.children}</div>
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
    </div>
  );
}
