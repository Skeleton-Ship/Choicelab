function elNodeCheck(el: HTMLElement) {
  if (el.classList.contains("node") && el.hasAttribute("data-id")) {
    return true;
  }
  return false;
}

function traverseForNode(el: HTMLElement) {
  const parentNode = el.parentNode as HTMLElement;
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

export default function elementIsNode(el: HTMLElement) {
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
