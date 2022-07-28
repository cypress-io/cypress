import _, { Dictionary } from 'lodash'
import Debug from 'debug'

import { getInvalidRootOptions, defaultSpecPattern, options, breakingOptions, breakingRootOptions, getInvalidTestingTypeOptions, testingTypeBreakingOptions, getTestingTypeConfigOptions } from './options'

// this export has to be done in 2 lines because of a bug in babel typescript
import * as validation from './validation'

import type { ConfigOption, BreakingOption, BreakingOptionErrorKey, RuntimeConfigOption } from './options'

export {
  defaultSpecPattern,
  validation,
  options,
  breakingOptions,
  getInvalidRootOptions,
  BreakingOption,
  BreakingOptionErrorKey,
  ValidationResult,
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
const rootConfigKeys = _(options).reject({ isInternal: true }).map('name').value()
const validationRules = createIndex(options, 'name', 'validation')
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

export const allowed = (obj = {}, testingType: TestingType) => {
  return _.pick(obj, getConfigKeys(testingType))
}

export const invalid = (obj = {}, testingType: TestingType) => {
  const opts = testingType ? getInvalidTestingTypeOptions(testingType) : getInvalidRootOptions()

  return _.pick(obj, _(opts).map('name').value().concat(breakingKeys))
}

export const getBreakingKeys = () => {
  return breakingKeys
}

export const getBreakingRootKeys = () => {
  return breakingRootOptions
}

export const getDefaultValues = (runtimeOptions: { [k: string]: any } = {}) => {
  const opts = getTestingTypeConfigOptions(runtimeOptions.testingType)

  // Default values can be functions, in which case they are evaluated
  // at runtime - for example, slowTestThreshold where the default value
  // varies between e2e and component testing.
  const defaultsForRuntime = _.mapValues(createIndex(opts, 'name', 'defaultValue'), (value) => (typeof value === 'function' ? value(runtimeOptions) : value))

  return { ...defaultsForRuntime, ...defaultsForRuntime[runtimeOptions.testingType] }
}

export const getConfigKeys = (testingType?: TestingType) => {
  return testingType ? _(getTestingTypeConfigOptions(testingType)).reject({ isInternal: true }).map('name').value() : rootConfigKeys
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

const _validateConfig = (allowedConfig: Array<ConfigOption|RuntimeConfigOption>, invalidConfig: Array<BreakingOption>, config: Record<string, any>, validationLevel: ValidationLevels): ValidationResult => {
  const allowed: Dictionary<ConfigOption | RuntimeConfigOption> = _(allowedConfig).reject({ isInternal: true }).chain().keyBy('name').value()
  const invalid: Dictionary<BreakingOption> = _(invalidConfig).chain().keyBy('name').value()

  const invalidOptions: Array<BreakingOption> = []
  const invalidConfigurationValues: Array<BreakingOption> = []

  _.each(config, (value, configKey) => {
    if (!allowed.hasOwnProperty(configKey)) {
      if (invalid.hasOwnProperty(configKey)) {
        invalidOptions.push(invalid[configKey] as BreakingOption)

        return
      }

      invalidOptions.push({
        name: configKey,
        errorKey: 'INVALID_CONFIG_OPTION',
        isWarning: true,
      })

      return
    }

    const { validation, defaultValue, overrideLevels = 'never' } = allowed[configKey] as ConfigOption
    const runTimeValidation = ['suite', 'test', 'testTime'].includes(validationLevel)

    if (runTimeValidation && (overrideLevels === 'never' || !overrideLevels.includes(validationLevel))) {
      invalidOptions.push({
        name: configKey,
        isWarning: false,
        // @ts-ignore
        errorKey: validationLevel === 'testTime' ? 'config.invalid_cypress_config_api_override' : 'config.invalid_test_config_override',
      })

      return
    }

    // config value is different from the default value
    if (value !== defaultValue) {
      const result = validation(configKey, value)

      if (result !== true) {
        invalidConfigurationValues.push(result)
      }
    }
  })

  return {
    invalidOptions,
    invalidConfigurationValues,
  }
}

const CONFIG_LEVELS = ['root', 'e2e', 'component'] as const

type ConfigLevel = typeof CONFIG_LEVELS[number]

const TESTING_TYPES = ['e2e', 'component'] as const

type TestingType = typeof TESTING_TYPES[number]

type ValidationResult = {
  invalidOptions: Array<BreakingOption>
  invalidConfigurationValues: Array<BreakingOption>
}

type ValidationRecord = Record<ConfigLevel, ValidationResult>

export const collectValidationResults = (config: Record<string, any>, validationLevel: ValidationLevels, configLevel: ConfigLevel = 'root'): ValidationRecord | ValidationResult => {
  if (configLevel !== 'root') {
    return _validateConfig(getTestingTypeConfigOptions(configLevel), getInvalidTestingTypeOptions(configLevel), config, validationLevel)
  }

  const result: any = {
    root: _validateConfig(options, getInvalidRootOptions().concat(breakingOptions), config, validationLevel),
  }

  TESTING_TYPES.forEach((testingType: ConfigLevel) => {
    // result[`${testingType}`] = _validateConfig(getTestingTypeConfigOptions(testingType), getInvalidTestingTypeOptions(testingType), config, validationLevel)
    result[`${testingType}`] = collectValidationResults(config[`${testingType}`], validationLevel, testingType)
  })

  return result as ValidationRecord
}

const validationLevels = ['configFile', 'pluginMerge', 'suite', 'test', 'testTime'] as const

type ValidationLevels = typeof validationLevels

// use validation level for check if can update at test time
export const validateConfiguration = (config: Record<string, any>, validationLevel: ValidationLevels, configLevel: ConfigLevel = 'root') => {
  const results = collectValidationResults(config, validationLevel, configLevel)

  if (configLevel !== 'root') {
    return results
  }

  const invalidOptions = _.reduce(results, (invalid, result, configLevel) => {
    if (result.invalidOptions.length) {
      result.invalidOptions.forEach((opt) => {
        invalid.push({
          ...opt,
          configLevel,
        })
      })
    }

    return invalid
  }, [])

  const invalidConfigurationValues = _.reduce(results, (invalid, result, configLevel) => {
    if (result.invalidConfigurationValues.length) {
      result.invalidConfigurationValues.forEach((opt) => {
        invalid.push({
          ...opt,
          configLevel,
        })
      })
    }

    return invalid
  }, [])

  return {
    invalidOptions,
    invalidConfigurationValues,
  }
}
