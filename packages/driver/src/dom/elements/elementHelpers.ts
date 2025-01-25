import $jquery from '../jquery'
import _ from 'lodash'
import type { HTMLSingleValueChangeInputElement, HTMLValueIsNumberTypeElement } from './types'

const inputTypeNeedSingleValueChangeRe = /^(date|time|week|month|datetime-local)$/

const valueIsNumberTypeRe = /progress|meter|li/

export const getTagName = (el) => {
  const tagName = el.tagName || ''

  return tagName.toLowerCase()
}

export const isElement = function (obj): obj is HTMLElement | JQuery<HTMLElement> {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0]
    }

    return Boolean(obj && _.isElement(obj))
  } catch (error) {
    return false
  }
}

export const isInput = (el): el is HTMLInputElement => {
  return getTagName(el) === 'input'
}

export const isTextarea = (el): el is HTMLTextAreaElement => {
  return getTagName(el) === 'textarea'
}

export const isButton = (el): el is HTMLButtonElement => {
  return getTagName(el) === 'button'
}

export const isSelect = (el): el is HTMLSelectElement => {
  return getTagName(el) === 'select'
}

export const isOption = (el) => {
  return getTagName(el) === 'option'
}

export const isOptgroup = (el) => {
  return getTagName(el) === 'optgroup'
}

export const isBody = (el): el is HTMLBodyElement => {
  return getTagName(el) === 'body'
}

export const isIframe = (el) => {
  return getTagName(el) === 'iframe'
}

export const isHTML = (el) => {
  return getTagName(el) === 'html'
}

export const isSvg = function (el): el is SVGElement {
  try {
    return 'ownerSVGElement' in el
  } catch (error) {
    return false
  }
}

export const isValueNumberTypeElement = (el: HTMLElement): el is HTMLValueIsNumberTypeElement => {
  return valueIsNumberTypeRe.test(getTagName(el))
}

export const isNeedSingleValueChangeInputElement = (el: HTMLElement): el is HTMLSingleValueChangeInputElement => {
  if (!isInput(el)) {
    return false
  }

  return inputTypeNeedSingleValueChangeRe.test((el.getAttribute('type') || '').toLocaleLowerCase())
}

export const isAttrType = function (el: HTMLInputElement, type: string) {
  const elType = (el.getAttribute('type') || '').toLowerCase()

  return elType === type
}
