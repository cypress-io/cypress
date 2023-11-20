// rules for native methods and props
// if a setter or getter or function then add a native method
// if a traversal, don't

import _ from 'lodash'
import $window from '../window'
import { isInput, isTextarea, isSelect, isButton, isSvg } from './elementHelpers'

// @ts-ignore
const descriptor = <T extends keyof Window, K extends keyof Window[T]['prototype']>(klass: T, prop: K) => {
  // @ts-ignore
  const desc = Object.getOwnPropertyDescriptor(window[klass].prototype, prop)

  if (desc === undefined) {
    throw new Error(`Error, could not get property descriptor for ${klass}  ${String(prop)}. This should never happen`)
  }

  return desc
}

const _getValue = function (this: any) {
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

const _setValue = function (this: any) {
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

const _getSelectionStart = function (this: any) {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'selectionStart').get
  }

  if (isTextarea(this)) {
    return descriptor('HTMLTextAreaElement', 'selectionStart').get
  }

  throw new Error('this should never happen, cannot get selectionStart')
}

const _getSelectionEnd = function (this: any) {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'selectionEnd').get
  }

  if (isTextarea(this)) {
    return descriptor('HTMLTextAreaElement', 'selectionEnd').get
  }

  throw new Error('this should never happen, cannot get selectionEnd')
}

const _nativeFocus = function (this: any) {
  if ($window.isWindow(this)) {
    return window.focus
  }

  if (isSvg(this)) {
    return window.SVGElement.prototype.focus
  }

  return window.HTMLElement.prototype.focus
}

const _nativeBlur = function (this: any) {
  if ($window.isWindow(this)) {
    return window.blur
  }

  if (isSvg(this)) {
    return window.SVGElement.prototype.blur
  }

  return window.HTMLElement.prototype.blur
}

const _nativeSetSelectionRange = function (this: any) {
  if (isInput(this)) {
    return window.HTMLInputElement.prototype.setSelectionRange
  }

  // is textarea
  return window.HTMLTextAreaElement.prototype.setSelectionRange
}

const _nativeSelect = function (this: any) {
  if (isInput(this)) {
    return window.HTMLInputElement.prototype.select
  }

  // is textarea
  return window.HTMLTextAreaElement.prototype.select
}

const _isContentEditable = function (this: any) {
  if (isSvg(this)) {
    return false
  }

  return descriptor('HTMLElement', 'isContentEditable').get
}

const _setType = function (this: any) {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'type').set
  }

  if (isButton(this)) {
    return descriptor('HTMLButtonElement', 'type').set
  }

  throw new Error('this should never happen, cannot set type')
}

const _getType = function (this: any) {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'type').get
  }

  if (isButton(this)) {
    return descriptor('HTMLButtonElement', 'type').get
  }

  throw new Error('this should never happen, cannot get type')
}

const _getMaxLength = function (this: any) {
  if (isInput(this)) {
    return descriptor('HTMLInputElement', 'maxLength').get
  }

  if (isTextarea(this)) {
    return descriptor('HTMLTextAreaElement', 'maxLength').get
  }

  throw new Error('this should never happen, cannot get maxLength')
}

export const tryCallNativeMethod = (obj, fn, ...args) => {
  try {
    return callNativeMethod(obj, fn, ...args)
  } catch (err) {
    return
  }
}

export const callNativeMethod = function (obj, fn, ...args) {
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
  style: descriptor('HTMLElement', 'style').get,
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
  setAttribute: window.Element.prototype.setAttribute,
  removeAttribute: window.Element.prototype.removeAttribute,
  setSelectionRange: _nativeSetSelectionRange,
  modify: window.Selection.prototype.modify,
  focus: _nativeFocus,
  hasFocus: window.document.hasFocus,
  blur: _nativeBlur,
  select: _nativeSelect,
  getStyleProperty: window.CSSStyleDeclaration.prototype.getPropertyValue,
  setStyleProperty: window.CSSStyleDeclaration.prototype.setProperty,
  removeStyleProperty: window.CSSStyleDeclaration.prototype.removeProperty,
}

export const getNativeProp = function<T, K extends keyof T> (obj: T, prop: K): T[K] {
  const nativeProp = nativeGetters[prop as string]

  if (!nativeProp) {
    const props = _.keys(nativeGetters).join(', ')

    throw new Error(`attempted to use a native getter prop called: ${String(prop)}. Available props are: ${props}`)
  }

  let retProp = nativeProp.call(obj, prop)

  if (_.isFunction(retProp)) {
    // if we got back another function
    // then invoke it again
    retProp = retProp.call(obj, prop)
  }

  return retProp
}

export const setNativeProp = function<T, K extends keyof T> (obj: T, prop: K, val) {
  const nativeProp = nativeSetters[prop as string]

  if (!nativeProp) {
    const fns = _.keys(nativeSetters).join(', ')

    throw new Error(`attempted to use a native setter prop called: ${String(prop)}. Available props are: ${fns}`)
  }

  let retProp = nativeProp.call(obj, val)

  if (_.isFunction(retProp)) {
    retProp = retProp.call(obj, val)
  }

  return retProp
}
