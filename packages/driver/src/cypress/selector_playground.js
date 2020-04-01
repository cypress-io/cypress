const _ = require('lodash')
const uniqueSelector = require('@cypress/unique-selector').default

const $utils = require('./utils')
const $errUtils = require('./error_utils')

const SELECTOR_PRIORITIES = 'data-cy data-test data-testid id class tag attributes nth-child'.split(' ')

const reset = () => {
  return {
    onElement: null,
    selectorPriority: SELECTOR_PRIORITIES,
  }
}

let defaults = reset()

module.exports = {
  reset () {
    defaults = reset()
  },

  getSelectorPriority () {
    return defaults.selectorPriority
  },

  getOnElement () {
    return defaults.onElement
  },

  getSelector ($el) {
    // if we have a callback, and it returned truthy
    let selector

    if (defaults.onElement && (selector = defaults.onElement($el))) {
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
  },

  defaults (props) {
    let onElement; let priority

    if (!_.isPlainObject(props)) {
      $errUtils.throwErrByPath('selector_playground.defaults_invalid_arg', {
        args: { arg: $utils.stringify(props) },
      })
    }

    priority = props.selectorPriority

    if (priority) {
      if (!_.isArray(priority)) {
        $errUtils.throwErrByPath('selector_playground.defaults_invalid_priority', {
          args: { arg: $utils.stringify(priority) },
        })
      }

      defaults.selectorPriority = priority
    }

    onElement = props.onElement

    if (onElement) {
      if (!_.isFunction(onElement)) {
        $errUtils.throwErrByPath('selector_playground.defaults_invalid_on_element', {
          args: { arg: $utils.stringify(onElement) },
        })
      }

      defaults.onElement = onElement
    }
  },
}
