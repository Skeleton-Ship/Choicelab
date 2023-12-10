function elStemCheck(el: any) {
  if (el.classList.contains("stem") && el.hasAttribute("data-id")) {
    return true;
  }
  return false;
}

function traverseForStem(el: any): any {
  const parentNode = el.parentNode;
  if (parentNode === document.body) {
    return false;
  } else {
    if (elStemCheck(parentNode)) {
      return parentNode;
    } else {
      return traverseForStem(parentNode);
    }
  }
}

export default function elementIsStem(el: any) {
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
