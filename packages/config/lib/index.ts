import _ from 'lodash'
import debugLib from 'debug'
import { options, breakingOptions, ResolvedConfigOption, BreakingOption } from './options'

const debug = debugLib('cypress:config:validator')
const dashesOrUnderscoresRe = /^(_-)+/

// takes an array and creates an index object of [keyKey]: [valueKey]
const createIndex = (arr: ReadonlyArray<ResolvedConfigOption>, keyKey, valueKey) => {
  return _.reduce(arr, (memo, item) => {
    if (item[valueKey] !== undefined) {
      memo[item[keyKey]] = item[valueKey]
    }

    return memo
  }, {})
}

// type ResolvedOpts = ReadonlyArray<ResolvedConfigOption>

type TOptions = typeof options
type AllOptions = TOptions[number]
type OptionsWithDefaults = {[K in keyof TOptions]: TOptions[K] extends { defaultValue: any } ? TOptions[K] : never}[keyof TOptions]
type OptionNames = AllOptions['name']
type OptionValidations = {[K in OptionNames]: AllOptions['validation']}
type OptionDefaultValues = {[K in OptionsWithDefaults['name']]: OptionsWithDefaults}

const breakingKeys = _.map(breakingOptions, 'name')
const defaultValues = createIndex(options, 'name', 'defaultValue') as OptionDefaultValues
const publicConfigKeys = _.filter(options, (opt) => opt)
const validationRules = createIndex(options, 'name', 'validation') as OptionValidations

export function validate <C extends object> (cfg: C, onErr: (msg: string) => void) {
  debug('validating configuration', cfg)

  _.each(cfg, (value: any, key: keyof OptionValidations) => {
    const validationFn = validationRules[key]

    // key has a validation rule & value different from the default
    if (validationFn && value !== defaultValues[key]) {
      const result = validationFn(key, value)

      if (result !== true) {
        onErr(result)
      }
    }
  })
}

export function allowed (obj = {}) {
  const propertyNames = publicConfigKeys.concat(breakingKeys)

  return _.pick(obj, propertyNames)
}

export default {
  allowed,

  getBreakingKeys: () => {
    return breakingKeys
  },

  getDefaultValues: (runtimeOptions = {}) => {
    // Default values can be functions, in which case they are evaluated
    // at runtime - for example, slowTestThreshold where the default value
    // varies between e2e and component testing.
    return _.mapValues(defaultValues, (value) => (typeof value === 'function' ? value(runtimeOptions) : value))
  },

  getPublicConfigKeys: () => {
    return publicConfigKeys
  },

  matchesConfigKey: (key) => {
    if (_.has(defaultValues, key)) {
      return key
    }

    key = key.toLowerCase().replace(dashesOrUnderscoresRe, '')
    key = _.camelCase(key)

    if (_.has(defaultValues, key)) {
      return key
    }
  },

  options,

  validate,

  validateNoBreakingConfig: (cfg, onWarning, onErr) => {
    breakingOptions.forEach(({ name, errorKey, newName, isWarning, value }: BreakingOption) => {
      if (cfg.hasOwnProperty(name)) {
        if (value && cfg[name] !== value) {
          // Bail if a value is specified but the config does not have that value.
          return
        }

        if (isWarning) {
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
  },
}
