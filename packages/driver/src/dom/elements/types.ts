declare global {
  interface Window {
    Element: typeof Element
    HTMLElement: typeof HTMLElement
    HTMLFormElement: typeof HTMLFormElement
    HTMLLinkElement: typeof HTMLLinkElement
    HTMLScriptElement: typeof HTMLScriptElement
    HTMLInputElement: typeof HTMLInputElement
    HTMLSelectElement: typeof HTMLSelectElement
    HTMLButtonElement: typeof HTMLButtonElement
    HTMLOptionElement: typeof HTMLOptionElement
    HTMLTextAreaElement: typeof HTMLTextAreaElement
    Selection: typeof Selection
    SVGElement: typeof SVGElement
    EventTarget: typeof EventTarget
    Document: typeof Document
    XMLHttpRequest: typeof XMLHttpRequest
  }

  interface Selection {
    modify: (alter?: string | undefined, direction?: string | undefined, granularity?: string | undefined) => void
  }
}

export interface HTMLContentEditableElement extends HTMLElement {
  isContenteditable: true
}

export type JQueryOrEl<T extends HTMLElement> = JQuery<T> | T

export type HTMLTextLikeElement = HTMLTextAreaElement | HTMLTextLikeInputElement | HTMLContentEditableElement

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

export interface HTMLValueIsNumberTypeElement extends HTMLElement {
  value: number
}

export interface HTMLSingleValueChangeInputElement extends HTMLInputElement {
  type: 'date' | 'time' | 'week' | 'month'
}

export interface HTMLElementCanSetSelectionRange extends HTMLElement {
  setSelectionRange: HTMLInputElement['setSelectionRange']
  value: HTMLInputElement['value']
  selectionStart: number
  selectionEnd: number
}
