import _ from 'lodash'
import uniqueSelector from '@cypress/unique-selector'

import $utils from './utils'
import $errUtils from './error_utils'

const SELECTOR_PRIORITIES = 'data-cy data-test data-testid data-qa id class tag attributes nth-child'.split(' ')

type Defaults = {
  onElement: Cypress.SelectorPlaygroundDefaultsOptions['onElement'] | null
  selectorPriority: Cypress.SelectorPlaygroundDefaultsOptions['selectorPriority']
}

const reset = (): Defaults => {
  return {
    onElement: null,
    selectorPriority: SELECTOR_PRIORITIES,
  }
}

let defaults = reset()

export default {
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
    const selector = defaults.onElement && defaults.onElement($el)

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
  },

  defaults (props) {
    if (!_.isPlainObject(props)) {
      $errUtils.throwErrByPath('selector_playground.defaults_invalid_arg', {
        args: { arg: $utils.stringify(props) },
      })
    }

    const { selectorPriority, onElement } = props

    if (selectorPriority) {
      if (!_.isArray(selectorPriority)) {
        $errUtils.throwErrByPath('selector_playground.defaults_invalid_priority_type', {
          args: { arg: $utils.stringify(selectorPriority) },
        })
      }
      // Validate that the priority is one of: "data-*", "id", "class", "tag", "attributes", "nth-child"

      selectorPriority.forEach((priority) => {
        if (!/^(data\-.*|id|class|tag|attributes|nth\-child)$/.test(priority)) {
          $errUtils.throwErrByPath('selector_playground.defaults_invalid_priority', {
            args: { arg: priority },
          })
        }
      })

      defaults.selectorPriority = selectorPriority
    }

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
