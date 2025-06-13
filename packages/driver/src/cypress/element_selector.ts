import _ from 'lodash'
import uniqueSelector from '@cypress/unique-selector'

import $utils from './utils'
import $errUtils from './error_utils'

const SELECTOR_PRIORITIES = 'data-cy data-test data-testid data-qa id class tag attributes nth-child'.split(' ')

type Defaults = {
  selectorPriority: Cypress.ElementSelectorDefaultsOptions['selectorPriority']
}

const reset = (): Defaults => {
  return {
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

  getSelector ($el) {
    // use uniqueSelector with the priorities
    return uniqueSelector($el.get(0), {
      selectorTypes: defaults.selectorPriority,
    })
  },

  defaults (props) {
    if (!_.isPlainObject(props)) {
      $errUtils.throwErrByPath('element_selector.defaults_invalid_arg', {
        args: { arg: $utils.stringify(props) },
      })
    }

    const { selectorPriority } = props

    if (selectorPriority) {
      if (!_.isArray(selectorPriority)) {
        $errUtils.throwErrByPath('element_selector.defaults_invalid_priority_type', {
          args: { arg: $utils.stringify(selectorPriority) },
        })
      }
      // Validate that the priority is one of: "data-*", "id", "class", "tag", "attributes", "nth-child"

      selectorPriority.forEach((priority) => {
        if (!/^(data\-.*|id|class|tag|attributes|nth\-child)$/.test(priority)) {
          $errUtils.throwErrByPath('element_selector.defaults_invalid_priority', {
            args: { arg: priority },
          })
        }
      })

      defaults.selectorPriority = selectorPriority
    }
  },
}
