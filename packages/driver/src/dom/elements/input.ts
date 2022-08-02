import { isButton, isInput } from './elementHelpers'
import { getNativeProp } from './nativeProps'
import $jquery from '../jquery'
import _ from 'lodash'
import type { JQueryOrEl } from './types'

export const isInputType = function (el: JQueryOrEl<HTMLElement>, type) {
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

export const isReadOnlyInputOrTextarea = (
  el: HTMLInputElement | HTMLTextAreaElement,
) => {
  return el.readOnly
}

export const isReadOnlyInput = ($el: JQuery) => {
  return $el.prop('readonly')
}

export const isInputAllowingImplicitFormSubmission = function ($el) {
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
