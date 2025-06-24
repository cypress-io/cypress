/// <reference types="cypress" />
import _ from 'lodash'
import uniqueSelector from '@cypress/unique-selector'

import $utils from './utils'
import $errUtils from './error_utils'

const VALID_SELECTOR_PRIORITY_REGEX = /^(data\-.+|id|class|tag|attributes|nth\-child|attribute:(.+)|name)$/

export const DEFAULT_SELECTOR_PRIORITIES = [
  'data-cy',
  'data-test',
  'data-testid',
  'data-qa',
  'name',
  'id',
  'class',
  'tag',
  'attributes',
  'nth-child',
] as const

export type Defaults = {
  selectorPriority: Cypress.SelectorPriority[]
}

export type ElementSelectorDefaultsOptions = {
  selectorPriority?: Cypress.SelectorPriority[]
}

export interface ElementSelectorAPI {
  reset(): void
  getSelectorPriority(): Cypress.SelectorPriority[]
  getSelector($el: any): string
  defaults(options: ElementSelectorDefaultsOptions): void
}

const reset = (): Defaults => {
  return {
    selectorPriority: [...DEFAULT_SELECTOR_PRIORITIES],
  }
}

let defaults = reset()

const ElementSelector: ElementSelectorAPI = {
  reset () {
    defaults = reset()
  },

  getSelectorPriority () {
    return defaults.selectorPriority
  },

  getSelector ($el: any) {
    return uniqueSelector($el.get(0), {
      selectorTypes: defaults.selectorPriority,
    })
  },

  defaults (props: ElementSelectorDefaultsOptions) {
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

      // Validate that the priority is one of:
      // "data-*", "id", "class", "tag", "attributes", "nth-child" , "attribute:*", "name"
      selectorPriority.forEach((priority) => {
        if (!VALID_SELECTOR_PRIORITY_REGEX.test(priority)) {
          $errUtils.throwErrByPath('element_selector.defaults_invalid_selector_priority', {
            args: { arg: priority },
          })
        }
      })

      defaults.selectorPriority = selectorPriority
    }
  },
}

export default ElementSelector
