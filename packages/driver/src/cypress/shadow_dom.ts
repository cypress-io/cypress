import _ from 'lodash'

import $utils from './utils'
import $errUtils from './error_utils'

interface ShadowDomConfig {
  shadowDomOptionPlaceholder?: boolean
}

interface ShadowDom {
  getConfig: () => ShadowDomConfig
  defaults: (props: Partial<ShadowDomConfig>) => ShadowDomConfig
  resolveInclusionValue: (Cypress: Cypress.Cypress, userValue: boolean) => boolean
}

const validateAndSetBoolean = (props: Partial<ShadowDomConfig>, values: Partial<ShadowDomConfig>, option: string): void => {
  const value = props[option]

  if (value == null) {
    return
  }

  if (!_.isBoolean(value)) {
    $errUtils.throwErrByPath('shadowDom.invalid_boolean', {
      args: {
        option,
        value: $utils.stringify(value),
      },
    })
  }

  values[option] = value
}

const validate = (props: Partial<ShadowDomConfig>): Partial<ShadowDomConfig> => {
  if (!_.isPlainObject(props)) {
    $errUtils.throwErrByPath('shadowDom.invalid_arg', {
      args: { value: $utils.stringify(props) },
    })
  }

  const values: Partial<ShadowDomConfig> = {}

  validateAndSetBoolean(props, values, 'shadowDomOptionPlaceholder')

  return values
}

export const createShadowDom = (): ShadowDom => {
  const options: ShadowDomConfig = {}

  return {
    getConfig (): ShadowDomConfig {
      return _.cloneDeep(options)
    },

    defaults (props: Partial<ShadowDomConfig>): ShadowDomConfig {
      const values = validate(props)

      return _.extend(options, values)
    },

    /**
    * Order of preference for including shadow dom:
    * experimental flag > command-level > defaults > test-level > suite-level > cypress.json
    */
    resolveInclusionValue (Cypress: Cypress.Cypress, userValue?: boolean): boolean {
      if (!Cypress.config('experimentalShadowDomSupport')) return false

      if (userValue != null) return userValue

      const defaultsValue = options.shadowDomOptionPlaceholder

      if (defaultsValue != null) return defaultsValue

      return Cypress.config('shadowDomOptionPlaceholder')
    },
  }
}
