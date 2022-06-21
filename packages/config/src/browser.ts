import _ from 'lodash'
import Debug from 'debug'
import { defaultSpecPattern, options, breakingOptions, breakingRootOptions, testingTypeBreakingOptions, additionalOptionsToResolveConfig } from './options'
import type { BreakingOption, BreakingOptionErrorKey } from './options'
import type { TestingType } from '@packages/types'

// this export has to be done in 2 lines because of a bug in babel typescript
import * as validation from './validation'

export {
  defaultSpecPattern,
  validation,
  options,
  breakingOptions,
  BreakingOption,
  BreakingOptionErrorKey,
}

const debug = Debug('cypress:config:browser')

const dashesOrUnderscoresRe = /^(_-)+/

// takes an array and creates an index object of [keyKey]: [valueKey]
function createIndex<T extends Record<string, any>> (arr: Array<T>, keyKey: keyof T, valueKey: keyof T) {
  return _.reduce(arr, (memo: Record<string, any>, item) => {
    if (item[valueKey] !== undefined) {
      memo[item[keyKey] as string] = item[valueKey]
    }

    return memo
  }, {})
}

const breakingKeys = _.map(breakingOptions, 'name')
const defaultValues = createIndex(options, 'name', 'defaultValue')
const publicConfigKeys = _([...options, ...additionalOptionsToResolveConfig]).reject({ isInternal: true }).map('name').value()
const validationRules = createIndex(options, 'name', 'validation')
const testConfigOverrideOptions = createIndex(options, 'name', 'canUpdateDuringTestTime')
const restartOnChangeOptionsKeys = _.filter(options, 'requireRestartOnChange')

const issuedWarnings = new Set()

export type BreakingErrResult = {
  name: string
  newName?: string
  value?: any
  configFile: string
  testingType?: TestingType
}

type ErrorHandler = (
  key: BreakingOptionErrorKey,
  options: BreakingErrResult
) => void

export function resetIssuedWarnings () {
  issuedWarnings.clear()
}

const validateNoBreakingOptions = (breakingCfgOptions: BreakingOption[], cfg: any, onWarning: ErrorHandler, onErr: ErrorHandler, testingType?: TestingType) => {
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
          testingType,
        })
      }

      return onErr(errorKey, {
        name,
        newName,
        value,
        configFile: cfg.configFile,
        testingType,
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

export const getDefaultValues = (runtimeOptions: { [k: string]: any } = {}) => {
  // Default values can be functions, in which case they are evaluated
  // at runtime - for example, slowTestThreshold where the default value
  // varies between e2e and component testing.
  const defaultsForRuntime = _.mapValues(defaultValues, (value) => (typeof value === 'function' ? value(runtimeOptions) : value))

  // As we normalize the config based on the selected testing type, we need
  // to do the same with the default values to resolve those correctly
  return { ...defaultsForRuntime, ...defaultsForRuntime[runtimeOptions.testingType] }
}

export const getPublicConfigKeys = () => {
  return publicConfigKeys
}

export const matchesConfigKey = (key: string) => {
  if (_.has(defaultValues, key)) {
    return key
  }

  key = key.toLowerCase().replace(dashesOrUnderscoresRe, '')
  key = _.camelCase(key)

  if (_.has(defaultValues, key)) {
    return key
  }

  return
}

export const validate = (cfg: any, onErr: (property: string) => void) => {
  debug('validating configuration')

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

export const validateNoBreakingConfigRoot = (cfg: any, onWarning: ErrorHandler, onErr: ErrorHandler, testingType: TestingType) => {
  return validateNoBreakingOptions(breakingRootOptions, cfg, onWarning, onErr, testingType)
}

export const validateNoBreakingConfig = (cfg: any, onWarning: ErrorHandler, onErr: ErrorHandler, testingType: TestingType) => {
  return validateNoBreakingOptions(breakingOptions, cfg, onWarning, onErr, testingType)
}

export const validateNoBreakingConfigLaunchpad = (cfg: any, onWarning: ErrorHandler, onErr: ErrorHandler) => {
  return validateNoBreakingOptions(breakingOptions.filter((option) => option.showInLaunchpad), cfg, onWarning, onErr)
}

export const validateNoBreakingTestingTypeConfig = (cfg: any, testingType: keyof typeof testingTypeBreakingOptions, onWarning: ErrorHandler, onErr: ErrorHandler) => {
  const options = testingTypeBreakingOptions[testingType]

  return validateNoBreakingOptions(options, cfg, onWarning, onErr, testingType)
}

export const validateNoReadOnlyConfig = (config: any, onErr: (property: string) => void) => {
  let errProperty

  Object.keys(config).some((option) => {
    return errProperty = testConfigOverrideOptions[option] === false ? option : undefined
  })

  if (errProperty) {
    return onErr(errProperty)
  }
}

export const validateNeedToRestartOnChange = (cachedConfig: any, updatedConfig: any) => {
  const restartOnChange = {
    browser: false,
    server: false,
  }

  if (!cachedConfig || !updatedConfig) {
    return restartOnChange
  }

  const configDiff = _.reduce<any, string[]>(cachedConfig, (result, value, key) => _.isEqual(value, updatedConfig[key]) ? result : result.concat(key), [])

  restartOnChangeOptionsKeys.forEach((o) => {
    if (o.requireRestartOnChange && configDiff.includes(o.name)) {
      restartOnChange[o.requireRestartOnChange] = true
    }
  })

  // devServer property is not part of the options, but we should trigger a server
  // restart if we identify any change
  if (!_.isEqual(cachedConfig.devServer, updatedConfig.devServer)) {
    restartOnChange.server = true
  }

  return restartOnChange
}
