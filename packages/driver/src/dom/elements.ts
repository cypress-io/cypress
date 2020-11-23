// NOT patched jquery
import $ from 'jquery'
import _ from '../config/lodash'
import $utils from '../cypress/utils'
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
const valueIsNumberTypeRe = /progress|meter|li/

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
    XMLHttpRequest: typeof XMLHttpRequest
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

interface HTMLValueIsNumberTypeElement extends HTMLElement {
  value: number
}

const isValueNumberTypeElement = (el: HTMLElement): el is HTMLValueIsNumberTypeElement => {
  return valueIsNumberTypeRe.test(getTagName(el))
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
  return $jquery.wrap(getAllParents($el[0])).index($maybeAncestor) >= 0
}

const getFirstCommonAncestor = (el1, el2) => {
  // get all parents of each element
  const el1Ancestors = [el1].concat(getAllParents(el1))
  const el2Ancestors = [el2].concat(getAllParents(el2))

  let a
  let b

  // choose the largest tree of parents to
  // traverse up
  if (el1Ancestors.length > el2Ancestors.length) {
    a = el1Ancestors
    b = el2Ancestors
  } else {
    a = el2Ancestors
    b = el1Ancestors
  }

  // for each ancestor of the largest of the two
  // parent arrays, check if the other parent array
  // contains it.
  for (const ancestor of a) {
    if (b.includes(ancestor)) {
      return ancestor
    }
  }

  return el2
}

const isShadowRoot = (maybeRoot) => {
  return maybeRoot?.toString() === '[object ShadowRoot]'
}

const isWithinShadowRoot = (node: HTMLElement) => {
  return isShadowRoot(node.getRootNode())
}

const getParentNode = (el) => {
  // if the element has a direct parent element,
  // simply return it.
  if (el.parentElement) {
    return el.parentElement
  }

  const root = el.getRootNode()

  // if the element is inside a shadow root,
  // return the host of the root.
  if (root && isWithinShadowRoot(el)) {
    return root.host
  }

  return null
}

const getParent = ($el: JQuery): JQuery => {
  return $(getParentNode($el[0]))
}

const getAllParents = (el: HTMLElement, untilSelectorOrEl?: string | HTMLElement | JQuery) => {
  const collectParents = (parents, node) => {
    const parent = getParentNode(node)

    if (!parent || untilSelectorOrEl && $(parent).is(untilSelectorOrEl)) {
      return parents
    }

    return collectParents(parents.concat(parent), parent)
  }

  return collectParents([], el)
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

  const nodes: Node[] = []

  // push the set of elements to the nodes array
  // whether they are wrapped or not
  if ($jquery.isJquery($el)) {
    nodes.push(...$el.toArray())
  } else if ($el) {
    nodes.push($el)
  }

  // if there are no nodes, nothing is attached
  if (nodes.length === 0) {
    return false
  }

  // check that every node has an active window
  // and is connected to the dom
  return nodes.every((node) => {
    const doc = $document.getDocumentFromElement(node)

    if (!$document.hasActiveWindow(doc)) {
      return false
    }

    return node.isConnected
  })
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

  // if they are equal, consider them a descendent
  if ($el1.get(0) === $el2.get(0)) {
    return true
  }

  // walk up the tree until we find a parent which
  // equals the descendent, if ever
  return findParent($el2.get(0), (node) => {
    if (node === $el1.get(0)) {
      return node
    }
  }) === $el1.get(0)
}

const findParent = (el, condition) => {
  const collectParent = (node) => {
    const parent = getParentNode(node)

    if (!parent) return null

    const parentMatchingCondition = condition(parent, node)

    if (parentMatchingCondition) return parentMatchingCondition

    return collectParent(parent)
  }

  return collectParent(el)
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

  const $parent = getParent($el)

  // if we have no parent then just return
  // the window since that can receive focus
  if (!$parent.length) {
    const win = $window.getWindowByElement($el.get(0))

    return $(win)
  }

  return getFirstFocusableEl(getParent($el))
}

const getActiveElByDocument = ($el: JQuery<HTMLElement>): HTMLElement | null => {
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

const getFirstParentWithTagName = ($el, tagName) => {
  if (isUndefinedOrHTMLBodyDoc($el) || !tagName) {
    return null
  }

  // if this element is already the tag we want,
  // return it
  if (getTagName($el.get(0)) === tagName) {
    return $el
  }

  // walk up the tree until we find a parent with
  // the tag we want
  return findParent($el.get(0), (node) => {
    if (getTagName(node) === tagName) {
      return $jquery.wrap(node)
    }

    return null
  })
}

const getFirstFixedOrStickyPositionParent = ($el) => {
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

const getFirstStickyPositionParent = ($el) => {
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

const getFirstScrollableParent = ($el) => {
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

const getFirstDeepestElement = ($el: JQuery, index = 0) => {
  // iterate through all of the elements in pairs
  // and check if the next item in the array is a
  // descedent of the current. if it is continue
  // to recurse. if not, or there is no next item
  // then return the current
  const $current = $el.slice(index, index + 1)
  const $next = $el.slice(index + 1, index + 2)

  if (!$next) {
    return $current
  }

  // does current contain next?
  if ($.contains($current.get(0), $next.get(0))) {
    return getFirstDeepestElement($el, index + 1)
  }

  // return the current if it already is a priority element
  if ($current.is(priorityElement)) {
    return $current
  }

  // else once we find the first deepest element then return its priority
  // parent if it has one and it exists in the elements chain
  const $parents = $jquery.wrap(getAllParents($current[0])).filter(priorityElement)
  const $priorities = $el.filter($parents)

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

// if the node has a shadow root, we must behave like
// the browser and find the inner element of the shadow
// root at that same point.
const getShadowElementFromPoint = (node, x, y) => {
  const nodeFromPoint = node?.shadowRoot?.elementFromPoint(x, y)

  if (!nodeFromPoint || nodeFromPoint === node) return node

  return getShadowElementFromPoint(nodeFromPoint, x, y)
}

const elementFromPoint = (doc, x, y) => {
  // first try the native elementFromPoint method
  let elFromPoint = doc.elementFromPoint(x, y)

  return getShadowElementFromPoint(elFromPoint, x, y)
}

const getShadowRoot = ($el: JQuery): JQuery<Node> => {
  const root = $el[0].getRootNode()

  return $(root)
}

const findAllShadowRoots = (root: Node): Node[] => {
  const collectRoots = (roots, nodes, node) => {
    const currentRoot = roots.pop()

    if (!currentRoot) return nodes

    const childRoots = findShadowRoots(currentRoot)

    if (childRoots.length > 0) {
      roots.push(...childRoots)
      nodes.push(...childRoots)
    }

    return collectRoots(roots, nodes, currentRoot)
  }

  return collectRoots([root], [], root)
}

const findShadowRoots = (root: Node): Node[] => {
  // get the document for this node
  const doc = root.getRootNode({ composed: true }) as Document
  // create a walker for efficiently traversing the
  // dom of this node
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_DOCUMENT_FRAGMENT, {
    acceptNode (node) {
      // we only care about nodes which have a shadow root
      if ((node as Element).shadowRoot) {
        return NodeFilter.FILTER_ACCEPT
      }

      // we skip other nodes, but continue to traverse their children
      return NodeFilter.FILTER_SKIP
    },
  })

  const roots: Node[] = []
  const rootAsElement = root as Element

  if (rootAsElement.shadowRoot) {
    roots.push(rootAsElement.shadowRoot)
  }

  const collectRoots = (roots) => {
    const nextNode = walker.nextNode() as Element

    if (!nextNode) return roots

    return collectRoots(roots.concat(nextNode.shadowRoot))
  }

  return collectRoots(roots)
}

const hasContenteditableAttr = (el: HTMLElement) => {
  const attr = tryCallNativeMethod(el, 'getAttribute', 'contenteditable')

  return attr !== undefined && attr !== null && attr !== 'false'
}

export {
  elementFromPoint,
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
  isValueNumberTypeElement,
  isNeedSingleValueChangeInputElement,
  canSetSelectionRangeElement,
  stringify,
  getNativeProp,
  setNativeProp,
  callNativeMethod,
  tryCallNativeMethod,
  findParent,
  findAllShadowRoots,
  findShadowRoots,
  isShadowRoot,
  isWithinShadowRoot,
  getElements,
  getFirstFocusableEl,
  getActiveElByDocument,
  getContainsSelector,
  getFirstDeepestElement,
  getFirstCommonAncestor,
  getTagName,
  getFirstParentWithTagName,
  getFirstFixedOrStickyPositionParent,
  getFirstStickyPositionParent,
  getFirstScrollableParent,
  getParent,
  getParentNode,
  getAllParents,
  getShadowRoot,
  hasContenteditableAttr,
}
