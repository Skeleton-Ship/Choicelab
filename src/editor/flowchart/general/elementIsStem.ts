function elStemCheck(el: Element) {
  if (el.classList.contains("stem") && el.hasAttribute("data-id")) {
    return true;
  }
  return false;
}

function traverseForStem(el: Element) {
  const parentNode = el.parentNode as Element;
  if (parentNode === document.body || parentNode === null) {
    return false;
  } else {
    if (elStemCheck(parentNode)) {
      return parentNode;
    } else {
      return traverseForStem(parentNode);
    }
  }
}

export default function elementIsStem(el: Element) {
  if (elStemCheck(el)) {
    return el;
  } else {
    const parentIsNode = traverseForStem(el);
    if (parentIsNode !== false) {
      return parentIsNode;
    }
    return false;
  }
}
