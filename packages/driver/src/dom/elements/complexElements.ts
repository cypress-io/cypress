import _ from 'lodash'
import $jquery from '../jquery'
import $ from 'jquery'
import $document from '../document'
import $window from '../window'
import { getHostContenteditable, isContentEditable, isDesignModeDocumentElement } from './contentEditable'
import { isInputType } from './input'
import { findParent, getParent, isUndefinedOrHTMLBodyDoc } from './find'
import { isInput, isTextarea } from './elementHelpers'
import { getNativeProp } from './nativeProps'
import { isWithinShadowRoot } from './shadow'
import type { HTMLElementCanSetSelectionRange, HTMLTextLikeElement } from './types'
import { isSelector } from './utils'
import Debug from 'debug'

const debug = Debug('cypress:driver:elements')
const canSetSelectionRangeElementRe = /^(text|search|URL|tel|password)$/

const fixedOrStickyRe = /(fixed|sticky)/

const focusableSelectors = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  '[tabindex]',
  '[contenteditable]',
]

const focusableWhenNotDisabledSelectors = [
  'a[href]',
  'area[href]',
  'input',
  'select',
  'textarea',
  'button',
  'iframe',
  '[tabindex]',
  '[contenteditable]',
]

/**
 * Element type and prop helpers
 */
export const isDisabled = ($el: JQuery) => {
  return $el.prop('disabled')
}

export const isButtonLike = (el: HTMLElement) => {
  const type = (type) => {
    return isInputType(el, type)
  }

  return _.some([
    type('button'),
    type('image'),
    type('reset'),
    type('submit'),
    type('checkbox'),
    type('radio'),
  ])
}

export const isTextLike = function (el: HTMLElement): el is HTMLTextLikeElement {
  const $el = $jquery.wrap(el)
  const sel = (selector) => {
    return isSelector($el, selector)
  }
  const type = (type) => {
    if (isInput(el)) {
      return isInputType(el, type)
    }

    return false
  }

  const isContentEditableElement = isContentEditable(el)

  if (isContentEditableElement) return true

  return _.some([
    isContentEditableElement,
    sel('textarea'),
    sel(':text'),
    type('text'),
    type('password'),
    type('email'),
    type('number'),
    type('date'),
    type('week'),
    type('month'),
    type('time'),
    type('datetime'),
    type('datetime-local'),
    type('search'),
    type('url'),
    type('tel'),
  ])
}

/**
 * Focusable checks and getters
 */

export const isFocused = (el) => {
  try {
    let doc

    if (isWithinShadowRoot(el)) {
      doc = el.getRootNode()
    } else {
      doc = $document.getDocumentFromElement(el)
    }

    const { activeElement, body } = doc

    if (activeElementIsDefault(activeElement, body)) {
      return false
    }

    return doc.activeElement === el
  } catch (err) {
    return false
  }
}

/**
 * The element can be activeElement, receive focus events, and also receive keyboard events
 */
export const isFocusable = ($el: JQuery<HTMLElement>) => {
  return (
    _.some(focusableSelectors, (sel) => $el.is(sel)) ||
     isDesignModeDocumentElement($el.get(0))
  )
}

export const isFocusedOrInFocused = (el: HTMLElement) => {
  debug('isFocusedOrInFocus', el)
  const doc = $document.getDocumentFromElement(el)

  if (!doc.hasFocus()) {
    return false
  }

  let root: Document | ShadowRoot

  if (isWithinShadowRoot(el)) {
    root = el.getRootNode() as ShadowRoot
  } else {
    root = doc
  }

  let { activeElement } = root

  let elToCheckCurrentlyFocused

  let isContentEditableEl = false

  if (isFocusable($(el))) {
    elToCheckCurrentlyFocused = el
  } else if (isContentEditable(el)) {
    isContentEditableEl = true
    elToCheckCurrentlyFocused = getHostContenteditable(el)
  }

  debug('elToCheckCurrentlyFocused', elToCheckCurrentlyFocused)

  if (elToCheckCurrentlyFocused && elToCheckCurrentlyFocused === activeElement) {
    if (isContentEditableEl) {
      // we make sure the the current document selection (blinking cursor) is inside the element
      const sel = doc.getSelection()

      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0)
        const curSelectionContainer = range.commonAncestorContainer

        const selectionInsideElement = el.contains(curSelectionContainer)

        debug('isInFocused by document selection?', selectionInsideElement, ':', curSelectionContainer, 'is inside', el)

        return selectionInsideElement
      }

      // no selection, not in focused
      return false
    }

    return true
  }

  return false
}

/**
 * The element can be activeElement, receive focus events, and also receive keyboard events
 * OR, it is a disabled element that would have been focusable
 */
export const isFocusableWhenNotDisabled = ($el: JQuery<HTMLElement>) => {
  return (
    _.some(focusableWhenNotDisabledSelectors, (sel) => $el.is(sel)) ||
    isDesignModeDocumentElement($el.get(0))
  )
}

export const getFirstFocusableEl = ($el: JQuery<HTMLElement>) => {
  if (isFocusable($el)) {
    return $el
  }

  const $parent = getParent($el)

  // if we have no parent then just return
  // the window since that can receive focus
  if (!$parent.length) {
    const win = $window.getWindowByElement($el.get(0))

    return $(win)
  }

  return getFirstFocusableEl(getParent($el))
}

/**
 * Active checks and getters
 */
export const getActiveElByDocument = ($el: JQuery<HTMLElement>): HTMLElement | null => {
  let activeElement

  if (isWithinShadowRoot($el[0])) {
    activeElement = ($el[0].getRootNode() as ShadowRoot).activeElement
  } else {
    activeElement = getNativeProp($el[0].ownerDocument as Document, 'activeElement')
  }

  if (isFocused(activeElement)) {
    return activeElement as HTMLElement
  }

  return null
}

/**
 * Scrollable checks and getters
 */
// active element is the default if its null
// or it's equal to document.body that is not contenteditable
const activeElementIsDefault = (activeElement, body: HTMLElement) => {
  return !activeElement || (activeElement === body && !isContentEditable(body))
}

const isScrollOrAuto = (prop) => {
  return prop === 'scroll' || prop === 'auto'
}

export const isScrollable = ($el) => {
  const checkDocumentElement = (win, documentElement) => {
    // Check if body height is higher than window height
    if (win.innerHeight < documentElement.scrollHeight) {
      debug('isScrollable: window scrollable on Y')

      return true
    }

    // Check if body width is higher than window width
    if (win.innerWidth < documentElement.scrollWidth) {
      debug('isScrollable: window scrollable on X')

      return true
    }

    // else return false since the window is not scrollable
    return false
  }

  // if we're the window, we want to get the document's
  // element and check its size against the actual window
  if ($window.isWindow($el)) {
    const win = $el

    return checkDocumentElement(win, win.document.documentElement)
  }

  const el = $el[0]

  // window.getComputedStyle(el) will error if el is undefined
  if (!el) {
    return false
  }

  // If we're at the documentElement, we check its size against the window
  const documentElement = $document.getDocumentFromElement(el).documentElement

  if (el === documentElement) {
    return checkDocumentElement($window.getWindowByElement(el), el)
  }

  // if we're any other element, we do some css calculations
  // to see that the overflow is correct and the scroll
  // area is larger than the actual height or width
  const { overflow, overflowY, overflowX } = window.getComputedStyle(el)

  // y axis
  // if our content height is less than the total scroll height
  if (el.clientHeight < el.scrollHeight) {
    // and our element has scroll or auto overflow or overflowX
    if (isScrollOrAuto(overflow) || isScrollOrAuto(overflowY)) {
      debug('isScrollable: clientHeight < scrollHeight and scroll/auto overflow')

      return true
    }
  }

  // x axis
  if (el.clientWidth < el.scrollWidth) {
    if (isScrollOrAuto(overflow) || isScrollOrAuto(overflowX)) {
      debug('isScrollable: clientWidth < scrollWidth and scroll/auto overflow')

      return true
    }
  }

  return false
}

/**
 * Getters where DOM state like focus, styling, and actionability affect the return value
 */
export const getFirstFixedOrStickyPositionParent = ($el): JQuery<any> | null => {
  if (isUndefinedOrHTMLBodyDoc($el)) {
    return null
  }

  if (fixedOrStickyRe.test($el.css('position'))) {
    return $el
  }

  // walk up the tree until we find an element
  // with a fixed/sticky position
  return findParent($el.get(0), (node) => {
    let wrapped = $jquery.wrap(node)

    if (fixedOrStickyRe.test(wrapped.css('position'))) {
      return wrapped
    }

    return null
  })
}

export const getFirstStickyPositionParent = ($el) => {
  if (isUndefinedOrHTMLBodyDoc($el)) {
    return null
  }

  if ($el.css('position') === 'sticky') {
    return $el
  }

  // walk up the tree until we find an element
  // with a sticky position
  return findParent($el.get(0), (node) => {
    let wrapped = $jquery.wrap(node)

    if (wrapped.css('position') === 'sticky') {
      return wrapped
    }

    return null
  })
}

export const getFirstScrollableParent = ($el) => {
  if (isUndefinedOrHTMLBodyDoc($el)) {
    return null
  }

  // walk up the tree until we find a scrollable
  // parent
  return findParent($el.get(0), (node) => {
    let wrapped = $jquery.wrap(node)

    if (isScrollable(wrapped)) {
      return wrapped
    }

    return null
  })
}

export const elOrAncestorIsFixedOrSticky = function ($el) {
  return !!getFirstFixedOrStickyPositionParent($el)
}

export const canSetSelectionRangeElement = (el): el is HTMLElementCanSetSelectionRange => {
  //TODO: If IE, all inputs can set selection range
  return isTextarea(el) || (isInput(el) && canSetSelectionRangeElementRe.test(getNativeProp(el, 'type')))
}
