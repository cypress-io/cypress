export class SvgElementWrapper {
  constructor(protected el: SVGElement) {}

  focus() {}

  blur() {}

  click() {}
}

export function isSvgElement(el: any): el is SVGElement {
  return true;
}
