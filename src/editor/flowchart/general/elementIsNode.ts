function elNodeCheck(el: Element) {
  if (el.classList.contains("node") && el.hasAttribute("data-id")) {
    return true;
  }
  return false;
}

function traverseForNode(el: Element) {
  const parentNode = el.parentNode as Element;
  if (parentNode === document.body) {
    return false;
  }
  if (parentNode === null) return false;
  if (elNodeCheck(parentNode)) {
    return parentNode;
  } else {
    return traverseForNode(parentNode);
  }
}

export default function elementIsNode(el: Element) {
  if (elNodeCheck(el)) {
    return el;
  } else {
    const parentIsNode = traverseForNode(el);
    if (parentIsNode !== false) {
      return parentIsNode;
    }
    return false;
  }
}
