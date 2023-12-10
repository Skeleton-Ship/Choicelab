function atBottom(el: HTMLElement) {
  let sh = el.scrollHeight,
    st = el.scrollTop,
    ht = el.offsetHeight;
  if (ht == 0) return true;
  return st == sh - ht;
}

function atRight(el: HTMLElement) {
  let sh = el.scrollWidth,
    st = el.scrollLeft,
    ht = el.offsetWidth;
  if (ht == 0) return true;
  return st == sh - ht;
}

function bindScrollBounce(axis: string, el: HTMLElement) {
  // Check if we already ran
  if (el.hasAttribute(`data-${axis}-bounce-enabled`)) {
    return;
  }
  // Require ID (needed for CSS)
  const id: string = el.getAttribute("id")?.replace("#", "") || "";
  if (!el.hasAttribute("id") || id === "") {
    console.error(
      "To enable scroll bounce on this element, specify an ID:",
      el
    );
    return;
  }
  el.setAttribute(`data-${axis}-bounce-enabled`, "");
  // Vars for calculating bounce
  let isScrolling = false;
  let scrollStart = 0;
  let velocityStart = 0;
  let velocity = 0;
  // Create style tag
  let bounceStyle = document.createElement("style");
  document.head.appendChild(bounceStyle);
  // On scroll end, reset listener and clear CSS
  el.addEventListener("scrollend", (e: Event) => {
    isScrolling = false;
    bounceStyle.innerHTML = "";
  });
  el.addEventListener("scroll", (e: Event) => {
    // Start listening to scroll location and velocity
    if (isScrolling === false) {
      isScrolling = true;
      if (axis === "y") {
        scrollStart = el.scrollTop;
      } else if (axis === "x") {
        scrollStart = el.scrollLeft;
      }
      velocityStart = Date.now();
    }
    // If position didn't move since last scroll event, just return
    if (
      (axis === "y" && el.scrollTop === 0 && scrollStart === 0) ||
      (axis === "x" && el.scrollLeft === 0 && scrollStart === 0)
    ) {
      return;
    }
    // Calculate velocity based on previous recorded time
    if (isScrolling === true) {
      velocity = (Date.now() - velocityStart) / 1000;
    }
    // Enable bounce IF we reach the bounds in any direction of the scroll container
    if (
      (axis === "y" && (el.scrollTop === 0 || atBottom(el))) ||
      (axis === "x" && (el.scrollLeft === 0 || atRight(el)))
    ) {
      // Determine scroll direction
      let scrollDirection;
      if (axis === "y") {
        if (el.scrollTop < scrollStart) {
          scrollDirection = "up";
        } else {
          scrollDirection = "down";
        }
      } else if (axis === "x") {
        if (el.scrollLeft < scrollStart) {
          scrollDirection = "left";
        } else {
          scrollDirection = "right";
        }
      }
      // Calculate overscroll
      let overscroll = (100 / (velocity * 70)) * 2;
      let scrollTravel = el.scrollTop - scrollStart;
      if (axis === "x") {
        scrollTravel = el.scrollLeft - scrollStart;
      }
      if (scrollDirection === "down" || scrollDirection === "right") {
        overscroll *= -1;
        scrollTravel *= -1;
      }
      // Limit overscroll if scroll travel is not very far
      let scrollTravelFactor;
      switch (scrollDirection) {
        case "up":
        case "left":
          scrollTravelFactor = (scrollTravel / 10) * -1;
          if (overscroll > scrollTravelFactor) {
            overscroll = scrollTravelFactor;
          }
          break;
        case "down":
        case "right":
          scrollTravelFactor = scrollTravel / 10;
          if (overscroll < scrollTravelFactor) {
            overscroll = scrollTravelFactor;
          }
      }
      // Set animation time
      const animationTime = 0.45;
      // Set style tag
      const cssAxis = axis.toUpperCase();
      const styleTag = `
		  @keyframes scroll-bounce-${axis}-${id} {
			  0% {
				  transform: translate${cssAxis}(0);
			  }
			  20% {
				  transform: translate${cssAxis}(${overscroll}px);
			  }
			  100% {
				  transform: translate${cssAxis}(0);
			  }
		  }
			  #${el.getAttribute("id")} {
				  animation: scroll-bounce-${axis}-${id} ${animationTime}s ease;
			  }
		  `;
      bounceStyle.innerHTML = styleTag;
      // Finally, reset scrolling as false
      isScrolling = false;
    }
  });
}

export default function enableScrollBounce(el: HTMLElement) {
  bindScrollBounce("y", el);
  bindScrollBounce("x", el);
}
