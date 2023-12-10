function elNodeCheck(el: any) {
  if (el.classList.contains("node") && el.hasAttribute("data-id")) {
    return true;
  }
  return false;
}

function traverseForNode(el: any): any {
  const parentNode = el.parentNode;
  if (parentNode === document.body) {
    return false;
  } else {
    if (elNodeCheck(parentNode)) {
      return parentNode;
    } else {
      return traverseForNode(parentNode);
    }
  }
}

export default function elementIsNode(el: any) {
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
