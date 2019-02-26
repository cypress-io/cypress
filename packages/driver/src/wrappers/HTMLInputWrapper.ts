export class HTMLInputElementWrapper {
  constructor(protected el: HTMLInputElement) {}

  get value() {
    return this.el.value;
  }
}
export function isHTMLInputWrapper(obj: any): obj is HTMLInputElement {
  return obj instanceof HTMLInputElement;
}

export function isInputWrapper(obj: any): obj is {};
