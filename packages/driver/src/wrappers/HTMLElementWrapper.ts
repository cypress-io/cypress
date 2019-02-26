export class HTMLElementWrapper {
  click() {}

  isCurrentlyClicked() {}
}

export function isElement(el: any): el is HTMLElement {
  return true;
}
