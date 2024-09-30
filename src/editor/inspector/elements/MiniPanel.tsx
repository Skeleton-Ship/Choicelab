import { useEffect } from "preact/hooks";
import { createRef } from "preact";
import PanelCornerTopLeft from "../../../assets/panel-images/corner-top-left.png";
import PanelCornerTopRight from "../../../assets/panel-images/corner-top-right.png";
import PanelCornerBottomLeft from "../../../assets/panel-images/corner-bottom-left.png";
import PanelCornerBottomRight from "../../../assets/panel-images/corner-bottom-right.png";
import PanelArrow from "../../../assets/panel-images/arrow.png";
import PanelSideLeft from "../../../assets/panel-images/side-left.png";
import PanelSideRight from "../../../assets/panel-images/side-right.png";
import PanelSideTop from "../../../assets/panel-images/side-top.png";
import PanelSideBottom from "../../../assets/panel-images/side-bottom.png";

export function MiniPanel(props: {
  origin: string;
  className?: string;
  open: boolean;
  children: preact.JSX.Element;
}) {
  useEffect(() => {
    if (!panelRef.current) return;
    const panel = panelRef.current;
    if (props.open === true) {
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
  const panelRef = createRef();
  return (
    <div class={`panel ${props.origin} ${props.className}`} ref={panelRef}>
      <div class="contents">{props.children}</div>
      <div class="decoration">
        <div
          class="corner top-left"
          style={{ backgroundImage: `url("${PanelCornerTopLeft}")` }}
        ></div>
        <div
          class="corner top-right"
          style={{ backgroundImage: `url("${PanelCornerTopRight}")` }}
        ></div>
        <div
          class="corner bottom-left"
          style={{ backgroundImage: `url("${PanelCornerBottomLeft}")` }}
        ></div>
        <div
          class="corner bottom-right"
          style={{ backgroundImage: `url("${PanelCornerBottomRight}")` }}
        ></div>
        <div
          class="side left"
          style={{ backgroundImage: `url("${PanelSideLeft}")` }}
        ></div>
        <div
          class="side right"
          style={{ backgroundImage: `url("${PanelSideRight}")` }}
        ></div>
        <div
          class="side bottom"
          style={{ backgroundImage: `url("${PanelSideBottom}")` }}
        ></div>
        <div class="side top">
          <div
            class="top-left"
            style={{ backgroundImage: `url("${PanelSideTop}")` }}
          ></div>
          <div
            class="top-right"
            style={{ backgroundImage: `url("${PanelSideTop}")` }}
          ></div>
          <div
            class="arrow"
            style={{ backgroundImage: `url("${PanelArrow}")` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
