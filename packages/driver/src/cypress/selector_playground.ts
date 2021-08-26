// @ts-nocheck
import _ from 'lodash'
import uniqueSelector from '@cypress/unique-selector'

import * as $utils from './utils'
import * as $errUtils from './error_utils'

const SELECTOR_PRIORITIES = 'data-cy data-test data-testid id class tag attributes nth-child'.split(' ')

const _reset = () => {
  return {
    onElement: null,
    selectorPriority: SELECTOR_PRIORITIES,
  }
}

let _defaults = _reset()

export function reset () {
  _defaults = _reset()
}

export function getSelectorPriority () {
  return _defaults.selectorPriority
}

export function getOnElement () {
  return _defaults.onElement
}

export function getSelector ($el) {
  // if we have a callback, and it returned truthy
  const selector = _defaults.onElement && _defaults.onElement($el)

  if (selector) {
    // and it returned a string
    if (_.isString(selector)) {
      // use this!
      return selector
    }
  }

  // else use uniqueSelector with the priorities
  return uniqueSelector($el.get(0), {
    selectorTypes: defaults.selectorPriority,
  })
}

export function defaults (props) {
  if (!_.isPlainObject(props)) {
    $errUtils.throwErrByPath('selector_playground.defaults_invalid_arg', {
      args: { arg: $utils.stringify(props) },
    })
  }

  const { selectorPriority: priority, onElement } = props

  if (priority) {
    if (!_.isArray(priority)) {
      $errUtils.throwErrByPath('selector_playground.defaults_invalid_priority', {
        args: { arg: $utils.stringify(priority) },
      })
    }

    _defaults.selectorPriority = priority
  }

  if (onElement) {
    if (!_.isFunction(onElement)) {
      $errUtils.throwErrByPath('selector_playground.defaults_invalid_on_element', {
        args: { arg: $utils.stringify(onElement) },
      })
    }

    _defaults.onElement = onElement
  }
}
