import _ from 'lodash'
import type errors from '@packages/errors'
import Debug from 'debug'
import { options, breakingOptions, breakingRootOptions, testingTypeBreakingOptions } from './options'
import type { BreakingOption } from './options'

export { breakingOptions }

const debug = Debug('cypress:config:validator')

const dashesOrUnderscoresRe = /^(_-)+/

// takes an array and creates an index object of [keyKey]: [valueKey]
const createIndex = (arr, keyKey, valueKey) => {
  return _.reduce(arr, (memo: Record<string, any>, item) => {
    if (item[valueKey] !== undefined) {
      memo[item[keyKey]] = item[valueKey]
    }

    return memo
  }, {})
}

const breakingKeys = _.map(breakingOptions, 'name')
const defaultValues = createIndex(options, 'name', 'defaultValue')
const publicConfigKeys = _(options).reject({ isInternal: true }).map('name').value()
const validationRules = createIndex(options, 'name', 'validation')
const testConfigOverrideOptions = createIndex(options, 'name', 'canUpdateDuringTestTime')

const issuedWarnings = new Set()

type ErrorHandler = (
  key: keyof typeof errors.AllCypressErrors,
  options: {
    name: string
    newName?: string
    value?: string
    configFile: string
  }) => void

const validateNoBreakingOptions = (breakingCfgOptions: BreakingOption[], cfg, onWarning: ErrorHandler, onErr: ErrorHandler) => {
  breakingCfgOptions.forEach(({ name, errorKey, newName, isWarning, value }) => {
    if (_.has(cfg, name)) {
      if (value && cfg[name] !== value) {
        // Bail if a value is specified but the config does not have that value.
        return
      }

      if (isWarning) {
        if (issuedWarnings.has(errorKey)) {
          return
        }

        // avoid re-issuing the same warning more than once
        issuedWarnings.add(errorKey)

        return onWarning(errorKey, {
          name,
          newName,
          value,
          configFile: cfg.configFile,
        })
      }

      return onErr(errorKey, {
        name,
        newName,
        value,
        configFile: cfg.configFile,
      })
    }
  })
}

export const allowed = (obj = {}) => {
  const propertyNames = publicConfigKeys.concat(breakingKeys)

  return _.pick(obj, propertyNames)
}

export const getBreakingKeys = () => {
  return breakingKeys
}

export const getBreakingRootKeys = () => {
  return breakingRootOptions
}

export const getDefaultValues = (runtimeOptions = {}) => {
  // Default values can be functions, in which case they are evaluated
  // at runtime - for example, slowTestThreshold where the default value
  // varies between e2e and component testing.
  return _.mapValues(defaultValues, (value) => (typeof value === 'function' ? value(runtimeOptions) : value))
}

export const getPublicConfigKeys = () => {
  return publicConfigKeys
}

export const matchesConfigKey = (key) => {
  if (_.has(defaultValues, key)) {
    return key
  }

  key = key.toLowerCase().replace(dashesOrUnderscoresRe, '')
  key = _.camelCase(key)

  if (_.has(defaultValues, key)) {
    return key
  }
}

export { options }

export const validate = (cfg, onErr) => {
  debug('validating configuration', cfg)

  return _.each(cfg, (value, key) => {
    const validationFn = validationRules[key]

    // key has a validation rule & value different from the default
    if (validationFn && value !== defaultValues[key]) {
      const result = validationFn(key, value)

      if (result !== true) {
        return onErr(result)
      }
    }
  })
}

export const validateNoBreakingConfigRoot = (cfg, onWarning: ErrorHandler, onErr: ErrorHandler) => {
  return validateNoBreakingOptions(breakingRootOptions, cfg, onWarning, onErr)
}

export const validateNoBreakingConfig = (cfg, onWarning: ErrorHandler, onErr: ErrorHandler) => {
  return validateNoBreakingOptions(breakingOptions, cfg, onWarning, onErr)
}

export const validateNoBreakingTestingTypeConfig = (cfg, testingType: keyof typeof testingTypeBreakingOptions, onWarning: ErrorHandler, onErr: ErrorHandler) => {
  const options = testingTypeBreakingOptions[testingType]

  return validateNoBreakingOptions(options, cfg, onWarning, onErr)
}

export const validateNoReadOnlyConfig = (config, onErr: (property: string) => void) => {
  let errProperty

  Object.keys(config).some((option) => {
    return errProperty = testConfigOverrideOptions[option] === false ? option : undefined
  })

  if (errProperty) {
    return onErr(errProperty)
  }
}
