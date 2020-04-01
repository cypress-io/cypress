// NOT patched jquery
import $ from 'jquery'
import _ from '../config/lodash'
import $utils from '../cypress/utils' //.coffee'
import * as $document from './document'
import * as $jquery from './jquery'
import * as $selection from './selection'
import { parentHasDisplayNone } from './visibility'
import * as $window from './window'
import Debug from 'debug'

const debug = Debug('cypress:driver:elements')

const { wrap } = $jquery

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

const inputTypeNeedSingleValueChangeRe = /^(date|time|week|month|datetime-local)$/
const canSetSelectionRangeElementRe = /^(text|search|URL|tel|password)$/

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

// rules for native methods and props
// if a setter or getter or function then add a native method
// if a traversal, don't

const descriptor = <T extends keyof Window, K extends keyof Window[T]['prototype']>(klass: T, prop: K) => {
  const descriptor = Object.getOwnPropertyDescriptor(window[klass].prototype, prop)

  if (descriptor === undefined) {
    throw new Error(`Error, could not get property descriptor for ${klass}  ${prop}. This should never happen`)
  }

  return descriptor
}

const _getValue = function () {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'value').get
  }

  if (isTextarea(this)) {
    return descriptor('HTMLTextAreaElement', 'value').get
  }

  if (isSelect(this)) {
    return descriptor('HTMLSelectElement', 'value').get
  }

  if (isButton(this)) {
    return descriptor('HTMLButtonElement', 'value').get
  }

  // is an option element
  return descriptor('HTMLOptionElement', 'value').get
}

const _setValue = function () {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'value').set
  }

  if (isTextarea(this)) {
    return descriptor('HTMLTextAreaElement', 'value').set
  }

  if (isSelect(this)) {
    return descriptor('HTMLSelectElement', 'value').set
  }

  if (isButton(this)) {
    return descriptor('HTMLButtonElement', 'value').set
  }

  // is an options element
  return descriptor('HTMLOptionElement', 'value').set
}

const _getSelectionStart = function () {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'selectionStart').get
  }

  if (isTextarea(this)) {
    return descriptor('HTMLTextAreaElement', 'selectionStart').get
  }

  throw new Error('this should never happen, cannot get selectionStart')
}

const _getSelectionEnd = function () {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'selectionEnd').get
  }

  if (isTextarea(this)) {
    return descriptor('HTMLTextAreaElement', 'selectionEnd').get
  }

  throw new Error('this should never happen, cannot get selectionEnd')
}

const _nativeFocus = function () {
  if ($window.isWindow(this)) {
    return window.focus
  }

  if (isSvg(this)) {
    return window.SVGElement.prototype.focus
  }

  return window.HTMLElement.prototype.focus
}

const _nativeBlur = function () {
  if ($window.isWindow(this)) {
    return window.blur
  }

  if (isSvg(this)) {
    return window.SVGElement.prototype.blur
  }

  return window.HTMLElement.prototype.blur
}

const _nativeSetSelectionRange = function () {
  if (isInput(this)) {
    return window.HTMLInputElement.prototype.setSelectionRange
  }

  // is textarea
  return window.HTMLTextAreaElement.prototype.setSelectionRange
}

const _nativeSelect = function () {
  if (isInput(this)) {
    return window.HTMLInputElement.prototype.select
  }

  // is textarea
  return window.HTMLTextAreaElement.prototype.select
}

const _isContentEditable = function () {
  if (isSvg(this)) {
    return false
  }

  return descriptor('HTMLElement', 'isContentEditable').get
}

const _setType = function () {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'type').set
  }

  if (isButton(this)) {
    return descriptor('HTMLButtonElement', 'type').set
  }

  throw new Error('this should never happen, cannot set type')
}

const _getType = function () {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'type').get
  }

  if (isButton(this)) {
    return descriptor('HTMLButtonElement', 'type').get
  }

  throw new Error('this should never happen, cannot get type')
}

const _getMaxLength = function () {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'maxLength').get
  }

  if (isTextarea(this)) {
    return descriptor('HTMLTextAreaElement', 'maxLength').get
  }

  throw new Error('this should never happen, cannot get maxLength')
}

const nativeGetters = {
  value: _getValue,
  isContentEditable: _isContentEditable,
  isCollapsed: descriptor('Selection', 'isCollapsed').get,
  selectionStart: _getSelectionStart,
  selectionEnd: _getSelectionEnd,
  type: _getType,
  activeElement: descriptor('Document', 'activeElement').get,
  body: descriptor('Document', 'body').get,
  frameElement: Object.getOwnPropertyDescriptor(window, 'frameElement')!.get,
  maxLength: _getMaxLength,
}

const nativeSetters = {
  value: _setValue,
  type: _setType,
}

const nativeMethods = {
  addEventListener: window.EventTarget.prototype.addEventListener,
  removeEventListener: window.EventTarget.prototype.removeEventListener,
  createRange: window.document.createRange,
  getSelection: window.document.getSelection,
  removeAllRanges: window.Selection.prototype.removeAllRanges,
  addRange: window.Selection.prototype.addRange,
  execCommand: window.document.execCommand,
  getAttribute: window.Element.prototype.getAttribute,
  setSelectionRange: _nativeSetSelectionRange,
  modify: window.Selection.prototype.modify,
  focus: _nativeFocus,
  hasFocus: window.document.hasFocus,
  blur: _nativeBlur,
  select: _nativeSelect,
}

const tryCallNativeMethod = (obj, fn, ...args) => {
  try {
    return callNativeMethod(obj, fn, ...args)
  } catch (err) {
    return
  }
}

const callNativeMethod = function (obj, fn, ...args) {
  const nativeFn = nativeMethods[fn]

  if (!nativeFn) {
    const fns = _.keys(nativeMethods).join(', ')

    throw new Error(`attempted to use a native fn called: ${fn}. Available fns are: ${fns}`)
  }

  let retFn = nativeFn.apply(obj, args)

  if (_.isFunction(retFn)) {
    retFn = retFn.apply(obj, args)
  }

  return retFn
}
const getNativeProp = function<T, K extends keyof T> (obj: T, prop: K): T[K] {
  const nativeProp = nativeGetters[prop as string]

  if (!nativeProp) {
    const props = _.keys(nativeGetters).join(', ')

    throw new Error(`attempted to use a native getter prop called: ${prop}. Available props are: ${props}`)
  }

  let retProp = nativeProp.call(obj, prop)

  if (_.isFunction(retProp)) {
    // if we got back another function
    // then invoke it again
    retProp = retProp.call(obj, prop)
  }

  return retProp
}

const setNativeProp = function<T, K extends keyof T> (obj: T, prop: K, val) {
  const nativeProp = nativeSetters[prop as string]

  if (!nativeProp) {
    const fns = _.keys(nativeSetters).join(', ')

    throw new Error(`attempted to use a native setter prop called: ${prop}. Available props are: ${fns}`)
  }

  let retProp = nativeProp.call(obj, val)

  if (_.isFunction(retProp)) {
    retProp = retProp.call(obj, val)
  }

  return retProp
}

export interface HTMLSingleValueChangeInputElement extends HTMLInputElement {
  type: 'date' | 'time' | 'week' | 'month'
}

const isNeedSingleValueChangeInputElement = (el: HTMLElement): el is HTMLSingleValueChangeInputElement => {
  if (!isInput(el)) {
    return false
  }

  return inputTypeNeedSingleValueChangeRe.test((el.getAttribute('type') || '').toLocaleLowerCase())
}

const canSetSelectionRangeElement = (el): el is HTMLElementCanSetSelectionRange => {
  //TODO: If IE, all inputs can set selection range
  return isTextarea(el) || (isInput(el) && canSetSelectionRangeElementRe.test(getNativeProp(el, 'type')))
}

const getTagName = (el) => {
  const tagName = el.tagName || ''

  return tagName.toLowerCase()
}

// this property is the tell-all for contenteditable
// should be true for elements:
//   - with [contenteditable]
//   - with document.designMode = 'on'
const isContentEditable = (el: HTMLElement): el is HTMLContentEditableElement => {
  return getNativeProp(el, 'isContentEditable') || $document.getDocumentFromElement(el).designMode === 'on'
}

const isTextarea = (el): el is HTMLTextAreaElement => {
  return getTagName(el) === 'textarea'
}

const isInput = (el): el is HTMLInputElement => {
  return getTagName(el) === 'input'
}

const isButton = (el): el is HTMLButtonElement => {
  return getTagName(el) === 'button'
}

const isSelect = (el): el is HTMLSelectElement => {
  return getTagName(el) === 'select'
}

const isOption = (el) => {
  return getTagName(el) === 'option'
}

const isOptgroup = (el) => {
  return getTagName(el) === 'optgroup'
}

const isBody = (el): el is HTMLBodyElement => {
  return getTagName(el) === 'body'
}

const isIframe = (el) => {
  return getTagName(el) === 'iframe'
}

const isHTML = (el) => {
  return getTagName(el) === 'html'
}

const isSvg = function (el): el is SVGElement {
  try {
    return 'ownerSVGElement' in el
  } catch (error) {
    return false
  }
}

// active element is the default if its null
// or it's equal to document.body that is not contenteditable
const activeElementIsDefault = (activeElement, body: HTMLElement) => {
  return !activeElement || (activeElement === body && !isContentEditable(body))
}

const isFocused = (el) => {
  try {
    const doc = $document.getDocumentFromElement(el)

    const { activeElement, body } = doc

    if (activeElementIsDefault(activeElement, body)) {
      return false
    }

    return doc.activeElement === el
  } catch (err) {
    return false
  }
}

const isFocusedOrInFocused = (el: HTMLElement) => {
  debug('isFocusedOrInFocus', el)

  const doc = $document.getDocumentFromElement(el)

  if (!doc.hasFocus()) {
    return false
  }

  const { activeElement } = doc

  let elToCheckCurrentlyFocused

  let isContentEditableEl = false

  if (isFocusable($(el))) {
    elToCheckCurrentlyFocused = el
  } else if (isContentEditable(el)) {
    isContentEditableEl = true
    elToCheckCurrentlyFocused = $selection.getHostContenteditable(el)
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

// mostly useful when traversing up parent nodes and wanting to
// stop traversal if el is undefined or is html, body, or document
const isUndefinedOrHTMLBodyDoc = ($el: JQuery<HTMLElement>) => {
  return !$el || !$el[0] || $el.is('body,html') || $document.isDocument($el[0])
}

const isElement = function (obj): obj is HTMLElement | JQuery<HTMLElement> {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0]
    }

    return Boolean(obj && _.isElement(obj))
  } catch (error) {
    return false
  }
}

const isDesignModeDocumentElement = (el: HTMLElement) => {
  return isElement(el) && getTagName(el) === 'html' && isContentEditable(el)
}
/**
 * The element can be activeElement, receive focus events, and also receive keyboard events
 */
const isFocusable = ($el: JQuery<HTMLElement>) => {
  return (
    _.some(focusableSelectors, (sel) => $el.is(sel)) ||
     isDesignModeDocumentElement($el.get(0))
  )
}

/**
 * The element can be activeElement, receive focus events, and also receive keyboard events
 * OR, it is a disabled element that would have been focusable
 */
const isFocusableWhenNotDisabled = ($el: JQuery<HTMLElement>) => {
  return (
    _.some(focusableWhenNotDisabledSelectors, (sel) => $el.is(sel)) ||
    isDesignModeDocumentElement($el.get(0))
  )
}

const isW3CRendered = (el) => {
  // @see https://html.spec.whatwg.org/multipage/rendering.html#being-rendered
  return !(parentHasDisplayNone(wrap(el)) || wrap(el).css('visibility') === 'hidden')
}

const isW3CFocusable = (el) => {
  // @see https://html.spec.whatwg.org/multipage/interaction.html#focusable-area
  return isFocusable(wrap(el)) && isW3CRendered(el)
}

type JQueryOrEl<T extends HTMLElement> = JQuery<T> | T

const isInputType = function (el: JQueryOrEl<HTMLElement>, type) {
  el = ([] as HTMLElement[]).concat($jquery.unwrap(el))[0]

  if (!isInput(el) && !isButton(el)) {
    return false
  }

  // NOTE: use DOMElement.type instead of getAttribute('type') since
  //       <input type="asdf"> will have type="text", and behaves like text type
  const elType = (getNativeProp(el, 'type') || '').toLowerCase()

  if (_.isArray(type)) {
    return _.includes(type, elType)
  }

  return elType === type
}

const isAttrType = function (el: HTMLInputElement, type: string) {
  const elType = (el.getAttribute('type') || '').toLowerCase()

  return elType === type
}

const isScrollOrAuto = (prop) => {
  return prop === 'scroll' || prop === 'auto'
}

const isAncestor = ($el, $maybeAncestor) => {
  return $el.parents().index($maybeAncestor) >= 0
}

const getFirstCommonAncestor = (el1, el2) => {
  const el1Ancestors = [el1].concat(getAllParents(el1))
  let curEl = el2

  while (curEl) {
    if (el1Ancestors.indexOf(curEl) !== -1) {
      return curEl
    }

    curEl = curEl.parentNode
  }

  return curEl
}

const getAllParents = (el) => {
  let curEl = el.parentNode
  const allParents: any[] = []

  while (curEl) {
    allParents.push(curEl)
    curEl = curEl.parentNode
  }

  return allParents
}

const isChild = ($el, $maybeChild) => {
  return $el.children().index($maybeChild) >= 0
}

const isSelector = ($el: JQuery<HTMLElement>, selector) => {
  return $el.is(selector)
}

const isDisabled = ($el: JQuery) => {
  return $el.prop('disabled')
}

const isReadOnlyInputOrTextarea = (
  el: HTMLInputElement | HTMLTextAreaElement,
) => {
  return el.readOnly
}

const isReadOnlyInput = ($el: JQuery) => {
  return $el.prop('readonly')
}

const isDetached = ($el) => {
  return !isAttached($el)
}

const isAttached = function ($el) {
  // if we're being given window
  // then these are automaticallyed attached
  if ($window.isWindow($el)) {
    // there is a code path when forcing focus and
    // blur on the window where this check is necessary.
    return true
  }

  // if this is a document we can simply check
  // whether or not it has a defaultView (window).
  // documents which are part of stale pages
  // will have this property null'd out
  if ($document.isDocument($el)) {
    return $document.hasActiveWindow($el)
  }

  // normalize into an array
  const els = [].concat($jquery.unwrap($el))

  // we could be passed an empty array here
  // which in that case it is not attached
  if (els.length === 0) {
    return false
  }

  // get the document from the first element
  const doc = $document.getDocumentFromElement(els[0])

  // TODO: i guess its possible each element
  // is technically bound to a different document
  // but c'mon
  const isIn = (el) => {
    return $.contains(doc as any, el)
  }

  // make sure the document is currently
  // active (it has a window) and
  // make sure every single element
  // is attached to this document
  return $document.hasActiveWindow(doc) && _.every(els, isIn)
}

/**
 * @param {HTMLElement} el
 */
const isDetachedEl = (el) => {
  return !isAttachedEl(el)
}

/**
 * @param {HTMLElement} el
 */
const isAttachedEl = function (el) {
  return isAttached($(el))
}

const isSame = function ($el1, $el2) {
  const el1 = $jquery.unwrap($el1)
  const el2 = $jquery.unwrap($el2)

  return el1 && el2 && _.isEqual(el1, el2)
}

export interface HTMLContentEditableElement extends HTMLElement {
  isContenteditable: true
}

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
  value: HTMLInputElement['value']
  selectionStart: number
  selectionEnd: number
}

export type HTMLTextLikeElement = HTMLTextAreaElement | HTMLTextLikeInputElement | HTMLContentEditableElement

const isTextLike = function (el: HTMLElement): el is HTMLTextLikeElement {
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

const isInputAllowingImplicitFormSubmission = function ($el) {
  const type = (type) => {
    return isInputType($el, type)
  }

  // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
  return _.some([
    type('text'),
    type('search'),
    type('url'),
    type('tel'),
    type('email'),
    type('password'),
    type('date'),
    type('month'),
    type('week'),
    type('time'),
    type('datetime-local'),
    type('number'),
  ])
}

const isScrollable = ($el) => {
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

const isDescendent = ($el1, $el2) => {
  if (!$el2) {
    return false
  }

  return !!($el1.get(0) === $el2.get(0) || $el1.has($el2).length)
}

const findParent = (el, fn) => {
  const recurse = (curEl, prevEl) => {
    if (!curEl) {
      return null
    }

    const retEl = fn(curEl, prevEl)

    if (retEl) {
      return retEl
    }

    const nextEl = curEl.parentElement

    return recurse(nextEl, curEl)
  }

  return recurse(el.parentElement, el) || el
}

// in order to simulate actual user behavior we need to do the following:
// 1. take our element and figure out its center coordinate
// 2. check to figure out the element listed at those coordinates
// 3. if this element is ourself or our descendants, click whatever was returned
// 4. else throw an error because something is covering us up
const getFirstFocusableEl = ($el: JQuery<HTMLElement>) => {
  if (isFocusable($el)) {
    return $el
  }

  const parent = $el.parent()

  // if we have no parent then just return
  // the window since that can receive focus
  if (!parent.length) {
    const win = $window.getWindowByElement($el.get(0))

    return $(win)
  }

  return getFirstFocusableEl($el.parent())
}
const getActiveElByDocument = (doc: Document): HTMLElement | null => {
  const activeElement = getNativeProp(doc, 'activeElement')

  if (isFocused(activeElement)) {
    return activeElement as HTMLElement
  }

  return null
}

const getFirstParentWithTagName = ($el, tagName) => {
  // return null if undefined or we're at body/html/document
  // cuz that means nothing has fixed position
  if (isUndefinedOrHTMLBodyDoc($el) || !tagName) {
    return null
  }

  // if we are the matching element return ourselves
  if (getTagName($el[0]) === tagName) {
    return $el
  }

  // else recursively continue to walk up the parent node chain
  return getFirstParentWithTagName($el.parent(), tagName)
}

const getFirstFixedOrStickyPositionParent = ($el) => {
  // return null if we're undefined or at not a normal DOM el
  // cuz that means nothing has fixed position
  if (isUndefinedOrHTMLBodyDoc($el)) {
    return null
  }

  // if we have fixed position return ourselves
  if (fixedOrStickyRe.test($el.css('position'))) {
    return $el
  }

  // else recursively continue to walk up the parent node chain
  return getFirstFixedOrStickyPositionParent($el.parent())
}

const getFirstStickyPositionParent = ($el) => {
  // return null if we're undefined or at body/html/document
  // cuz that means nothing has sticky position
  if (isUndefinedOrHTMLBodyDoc($el)) {
    return null
  }

  // if we have sticky position return ourselves
  if ($el.css('position') === 'sticky') {
    return $el
  }

  // else recursively continue to walk up the parent node chain
  return getFirstStickyPositionParent($el.parent())
}

const getFirstScrollableParent = ($el) => {
  // this may be null or not even defined in IE
  // scrollingElement = doc.scrollingElement

  const search = ($el) => {
    const $parent = $el.parent()

    // parent is undefined or
    // instead of fussing with scrollingElement
    // we'll simply return null here and let our
    // caller deal with situations where they're
    // needing to scroll the window or scrollableElement
    if (isUndefinedOrHTMLBodyDoc($parent)) {
      return null
    }

    if (isScrollable($parent)) {
      return $parent
    }

    return search($parent)
  }

  return search($el)
}

const getElements = ($el) => {
  // bail if no $el or length
  if (!_.get($el, 'length')) {
    return
  }

  // unroll the jquery object
  const els = $jquery.unwrap($el)

  if (els.length === 1) {
    return els[0]
  }

  return els
}

const whitespaces = /\s+/g

// When multiple space characters are considered as a single whitespace in all tags except <pre>.
const normalizeWhitespaces = (elem) => {
  let testText = elem.textContent || elem.innerText || $(elem).text()

  if (elem.tagName === 'PRE') {
    return testText
  }

  return testText.replace(whitespaces, ' ')
}
const getContainsSelector = (text, filter = '', options: {
  matchCase?: boolean
} = {}) => {
  const $expr = $.expr[':']

  const escapedText = $utils.escapeQuotes(text)

  // they may have written the filter as
  // comma separated dom els, so we want to search all
  // https://github.com/cypress-io/cypress/issues/2407
  const filters = filter.trim().split(',')

  let cyContainsSelector

  if (_.isRegExp(text)) {
    if (options.matchCase === false && !text.flags.includes('i')) {
      text = new RegExp(text.source, text.flags + 'i') // eslint-disable-line prefer-template
    }

    // taken from jquery's normal contains method
    cyContainsSelector = function (elem) {
      let testText = normalizeWhitespaces(elem)

      return text.test(testText)
    }
  } else if (_.isString(text)) {
    cyContainsSelector = function (elem) {
      let testText = normalizeWhitespaces(elem)

      if (!options.matchCase) {
        testText = testText.toLowerCase()
        text = text.toLowerCase()
      }

      return testText.includes(text)
    }
  } else {
    cyContainsSelector = $expr.contains
  }

  // we set the `cy-contains` jquery selector which will only be used
  // in the context of cy.contains(...) command and selector playground.
  $expr['cy-contains'] = cyContainsSelector

  const selectors = _.map(filters, (filter) => {
    // use custom cy-contains selector that is registered above
    return `${filter}:not(script,style):cy-contains('${escapedText}'), ${filter}[type='submit'][value~='${escapedText}']`
  })

  return selectors.join()
}

const priorityElement = 'input[type=\'submit\'], button, a, label'

const getFirstDeepestElement = (elements, index = 0) => {
  // iterate through all of the elements in pairs
  // and check if the next item in the array is a
  // descedent of the current. if it is continue
  // to recurse. if not, or there is no next item
  // then return the current
  const $current = elements.slice(index, index + 1)
  const $next = elements.slice(index + 1, index + 2)

  if (!$next) {
    return $current
  }

  // does current contain next?
  if ($.contains($current.get(0), $next.get(0))) {
    return getFirstDeepestElement(elements, index + 1)
  }

  // return the current if it already is a priority element
  if ($current.is(priorityElement)) {
    return $current
  }

  // else once we find the first deepest element then return its priority
  // parent if it has one and it exists in the elements chain
  const $priorities = elements.filter($current.parents(priorityElement))

  if ($priorities.length) {
    return $priorities.last()
  }

  return $current
}

// short form css-inlines the element
// long form returns the outerHTML
const stringify = (el, form = 'long') => {
  // if we are formatting the window object
  if ($window.isWindow(el)) {
    return '<window>'
  }

  // if we are formatting the document object
  if ($document.isDocument(el)) {
    return '<document>'
  }

  // convert this to jquery if its not already one
  const $el = $jquery.wrap(el)

  const long = () => {
    const str = $el
    .clone()
    .empty()
    .prop('outerHTML')

    const text = (_.chain($el.text()) as any)
    .clean()
    .truncate({ length: 10 })
    .value()
    const children = $el.children().length

    if (children) {
      return str.replace('></', '>...</')
    }

    if (text) {
      return str.replace('></', `>${text}</`)
    }

    return str
  }

  const short = () => {
    const id = $el.prop('id')
    const klass = $el.attr('class')
    let str = $el.prop('tagName').toLowerCase()

    if (id) {
      str += `#${id}`
    }

    // using attr here instead of class because
    // svg's return an SVGAnimatedString object
    // instead of a normal string when calling
    // the property 'class'
    if (klass) {
      str += `.${klass.split(/\s+/).join('.')}`
    }

    // if we have more than one element,
    // format it so that the user can see there's more
    if ($el.length > 1) {
      return `[ <${str}>, ${$el.length - 1} more... ]`
    }

    return `<${str}>`
  }

  return $utils.switchCase(form, {
    long,
    short,
  })
}

export {
  isElement,
  isUndefinedOrHTMLBodyDoc,
  isSelector,
  isScrollOrAuto,
  isFocusable,
  isFocusableWhenNotDisabled,
  isDisabled,
  isReadOnlyInput,
  isReadOnlyInputOrTextarea,
  isW3CFocusable,
  isAttached,
  isDetached,
  isAttachedEl,
  isDetachedEl,
  isAncestor,
  isChild,
  isScrollable,
  isTextLike,
  isDescendent,
  isContentEditable,
  isSame,
  isOption,
  isOptgroup,
  isBody,
  isHTML,
  isInput,
  isIframe,
  isTextarea,
  isInputType,
  isAttrType,
  isFocused,
  isFocusedOrInFocused,
  isInputAllowingImplicitFormSubmission,
  isNeedSingleValueChangeInputElement,
  canSetSelectionRangeElement,
  stringify,
  getNativeProp,
  setNativeProp,
  callNativeMethod,
  tryCallNativeMethod,
  findParent,
  getElements,
  getFirstFocusableEl,
  getActiveElByDocument,
  getContainsSelector,
  getFirstDeepestElement,
  getFirstCommonAncestor,
  getFirstParentWithTagName,
  getFirstFixedOrStickyPositionParent,
  getFirstStickyPositionParent,
  getFirstScrollableParent,
}
