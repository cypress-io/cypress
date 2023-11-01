import _ from 'lodash'
import Debug from 'debug'
import {
  defaultSpecPattern,
  defaultExcludeSpecPattern,
  options,
  breakingOptions,
  breakingRootOptions,
  testingTypeBreakingOptions,
} from './options'

import type { BreakingErrResult, TestingType } from '@packages/types'
import type { BreakingOption, BreakingOptionErrorKey, OverrideLevel } from './options'
import type { ErrResult } from './validation'

// this export has to be done in 2 lines because of a bug in babel typescript
import * as validation from './validation'

export {
  defaultSpecPattern,
  defaultExcludeSpecPattern,
  options,
  breakingOptions,
  BreakingOption,
  BreakingOptionErrorKey,
  ErrResult,
  validation,
}

const debug = Debug('cypress:config:browser')

const dashesOrUnderscoresRe = /^(_-)+/

// takes an array and creates an index object of [keyKey]: [valueKey]
function createIndex<T extends Record<string, any>> (arr: Array<T>, keyKey: keyof T, valueKey: keyof T, defaultValueFallback?: any) {
  return _.reduce(arr, (memo: Record<string, any>, item) => {
    if (item[valueKey] !== undefined) {
      memo[item[keyKey]] = item[valueKey]
    } else {
      memo[item[keyKey]] = defaultValueFallback
    }

    return memo
  }, {})
}

const breakingKeys = _.map(breakingOptions, 'name')
const defaultValues = createIndex(options, 'name', 'defaultValue')
const publicConfigKeys = _(options).reject({ isInternal: true }).map('name').value()
const validationRules = createIndex(options, 'name', 'validation')

export const testOverrideLevels = createIndex(options, 'name', 'overrideLevel', 'never')

const restartOnChangeOptionsKeys = _.filter(options, 'requireRestartOnChange')

const issuedWarnings = new Set()

export type InvalidTestOverrideResult = {
  invalidConfigKey: string
  supportedOverrideLevel: string
}

type ErrorHandler = (
  key: BreakingOptionErrorKey,
  options: BreakingErrResult
) => void

export function resetIssuedWarnings () {
  issuedWarnings.clear()
}

const validateNoBreakingOptions = (breakingCfgOptions: Readonly<BreakingOption[]>, cfg: any, onWarning: ErrorHandler, onErr: ErrorHandler, testingType?: TestingType) => {
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

export const validate = (cfg: any, onErr: (property: ErrResult | string) => void, testingType: TestingType | null) => {
  debug('validating configuration', cfg)

  return _.each(cfg, (value, key) => {
    const validationFn = validationRules[key]

    // key has a validation rule & value different from the default
    if (validationFn && value !== defaultValues[key]) {
      const result = validationFn(key, value, {
        // if we are validating the e2e or component-specific configuration values, pass
        // the key testing type as the testing type to ensure correct validation
        testingType: (key === 'e2e' || key === 'component') ? key : testingType,
      })

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

export const validateOverridableAtRunTime = (config: any, isSuiteLevelOverride: boolean, onErr: (result: InvalidTestOverrideResult) => void) => {
  Object.keys(config).some((configKey) => {
    const overrideLevel: OverrideLevel = testOverrideLevels[configKey]

    if (!overrideLevel) {
      // non-cypress configuration option. skip validation
      return
    }

    // this is unique validation, not applied to the general cy config.
    // it will be removed when we support defining experimental retries
    // in test config overrides

    // TODO: remove when experimental retry overriding is supported

    if (configKey === 'retries') {
      const experimentalRetryCfgKeys = [
        'experimentalStrategy', 'experimentalOptions',
      ]

      Object.keys(config.retries || {})
      .filter((v) => experimentalRetryCfgKeys.includes(v))
      .forEach((invalidExperimentalCfgOverride) => {
        onErr({
          invalidConfigKey: `retries.${invalidExperimentalCfgOverride}`,
          supportedOverrideLevel: 'global_only',
        })
      })
    }
    // TODO: add a hook to ensure valid testing-type configuration is being set at runtime for all configuration values.
    // https://github.com/cypress-io/cypress/issues/24365

    if (overrideLevel === 'never' || (overrideLevel === 'suite' && !isSuiteLevelOverride)) {
      onErr({
        invalidConfigKey: configKey,
        supportedOverrideLevel: overrideLevel,
      })
    }
  })
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
