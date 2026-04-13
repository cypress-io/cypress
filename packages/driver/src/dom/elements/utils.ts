import $ from 'jquery'
import $jquery from '../jquery'
import $window from '../window'
import $document from '../document'
import { clean } from '@packages/utils'

const whitespaces = /\s+/g

// When multiple space characters are considered as a single whitespace in all tags except <pre>.
export const normalizeWhitespaces = (elem) => {
  let testText = elem.textContent || elem.innerText || $(elem).text()

  if (elem.tagName === 'PRE') {
    return testText
  }

  return testText.replace(whitespaces, ' ')
}

export const isSame = function ($el1, $el2) {
  const el1 = $jquery.unwrap($el1)
  const el2 = $jquery.unwrap($el2)

  return el1 && el2 && el1 === el2
}

export const isSelector = ($el: JQuery<HTMLElement>, selector) => {
  return $el.is(selector)
}

const resolveValue = (obj, key) => {
  const v = obj[key]

  return typeof v === 'function' ? v.call(obj) : v
}

export function switchCase (value, casesObj, defaultKey = 'default') {
  if (Object.prototype.hasOwnProperty.call(casesObj, value)) {
    return resolveValue(casesObj, value)
  }

  if (Object.prototype.hasOwnProperty.call(casesObj, defaultKey)) {
    return resolveValue(casesObj, defaultKey)
  }

  const keys = Object.keys(casesObj)

  throw new Error(`The switch/case value: '${value}' did not match any cases: ${keys.join(', ')}.`)
}

export const stringify = (el, form = 'long') => {
  if (typeof el === 'string') {
    return el
  }

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

    const cleanedText = clean($el.text())
    const text = cleanedText.length > 10 ? `${cleanedText.slice(0, 7)}...` : cleanedText
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
    let str = $el.length ? $el.prop('tagName').toLowerCase() : el.selector

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

  return switchCase(form, {
    long,
    short,
  })
}
