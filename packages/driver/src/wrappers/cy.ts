import { isSvgElement, SvgElementWrapper } from "./SvgElementWrapper";
import { isElement, HTMLElementWrapper } from "./HTMLElementWrapper";

export const cy = {
  click<T extends HTMLElement | SVGElement>(el: T) {
    if (isSvgElement(el)) {
      return new SvgElementWrapper(el).click();
    }
    if (isElement(el)) {
      return new HTMLElementWrapper(el).click();
    }
  }
};
