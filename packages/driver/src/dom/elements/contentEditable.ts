import { getNativeProp, tryCallNativeMethod } from './nativeProps'
import $document from '../document'
import { getTagName, isElement } from './elementHelpers'
import type { HTMLContentEditableElement } from './types'

// this property is the tell-all for contenteditable
// should be true for elements:
//   - with [contenteditable]
//   - with document.designMode = 'on'
export const isContentEditable = (el: HTMLElement): el is HTMLContentEditableElement => {
  return getNativeProp(el, 'isContentEditable') || $document.getDocumentFromElement(el).designMode === 'on'
}

export const hasContenteditableAttr = (el: HTMLElement) => {
  const attr = tryCallNativeMethod(el, 'getAttribute', 'contenteditable')

  return attr !== undefined && attr !== null && attr !== 'false'
}

export const getHostContenteditable = function (el: HTMLElement) {
  let curEl = el

  while (curEl.parentElement && !hasContenteditableAttr(curEl)) {
    curEl = curEl.parentElement
  }

  // if there's no host contenteditable, we must be in designMode
  // so act as if the documentElement (html element) is the host contenteditable
  if (!hasContenteditableAttr(curEl)) {
    return $document.getDocumentFromElement(el).documentElement
  }

  return curEl
}

export const isDesignModeDocumentElement = (el: HTMLElement) => {
  return isElement(el) && getTagName(el) === 'html' && isContentEditable(el)
}
