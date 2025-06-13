/// <reference types="cypress" />
import _ from 'lodash'
import uniqueSelector from '@cypress/unique-selector'

import $utils from './utils'
import $errUtils from './error_utils'

export const DEFAULT_SELECTOR_PRIORITIES = [
  'data-cy',
  'data-test',
  'data-testid',
  'data-qa',
  'id',
  'class',
  'tag',
  'attributes',
  'nth-child',
] as const

export type SelectorType = string

export type Defaults = {
  selectorPriority: SelectorType[]
}

export type ElementSelectorDefaultsOptions = {
  selectorPriority?: SelectorType[]
}

export interface ElementSelectorAPI {
  reset(): void
  getSelectorPriority(): SelectorType[]
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

      defaults.selectorPriority = selectorPriority
    }
  },
}

export default ElementSelector
