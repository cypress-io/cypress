declare global {
  interface Window {
    Element: typeof Element
    HTMLElement: typeof HTMLElement
    HTMLInputElement: typeof HTMLInputElement
    HTMLSelectElement: typeof HTMLSelectElement
    HTMLButtonElement: typeof HTMLButtonElement
    HTMLOptionElement: typeof HTMLOptionElement
    HTMLTextAreaElement: typeof HTMLTextAreaElement
    Selection: typeof Selection
    SVGElement: typeof SVGElement
    EventTarget: typeof EventTarget
    Document: typeof Document
  }

  interface Selection {
    modify: Function
  }
}

export interface HTMLSingleValueChangeInputElement extends HTMLInputElement {
  type: 'date' | 'time' | 'week' | 'month'
}

export interface HTMLContentEditableElement extends HTMLElement {}

export interface HTMLTextLikeInputElement extends HTMLInputElement {
  type:
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'date'
  | 'week'
  | 'month'
  | 'time'
  | 'datetime'
  | 'datetime-local'
  | 'search'
  | 'url'
  | 'tel'
  setSelectionRange: HTMLInputElement['setSelectionRange']
}

export interface HTMLElementCanSetSelectionRange extends HTMLElement {
  setSelectionRange: HTMLInputElement['setSelectionRange']
}

export type HTMLTextLikeElement =
  | HTMLTextAreaElement
  | HTMLTextLikeInputElement
  | HTMLContentEditableElement
