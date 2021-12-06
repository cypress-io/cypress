import _ from 'lodash'
import debugLib from 'debug'
import { options, breakingOptions, ResolvedConfigOption, BreakingOption, allConfigOptions } from './options'

export { options, allConfigOptions }

const debug = debugLib('cypress:config:validator')

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

type OptionNames = AllOptions['name']
type OptionDefaultByName<Name extends OptionNames> = {[K in keyof TOptions]: TOptions[K] extends { name: Name, defaultValue: infer U } ? U : never}[keyof TOptions]
type TOptions = typeof options
type AllOptions = TOptions[number]
type OptionsWithDefaults = {[K in keyof TOptions]: TOptions[K] extends { defaultValue: any } ? TOptions[K] : never}[keyof TOptions]
type OptionValidations = {[K in OptionNames]: AllOptions['validation']}
type OptionDefaultValues = {[K in OptionsWithDefaults['name']]: OptionDefaultByName<K>}

const breakingKeys = _.map(breakingOptions, 'name')
const defaultValues = createIndex(options, 'name', 'defaultValue') as OptionDefaultValues
const publicConfigKeys = _.filter(options, (opt) => opt)
const validationRules = createIndex(options, 'name', 'validation') as OptionValidations

export function defaultsForTestingType (testingType?: 'e2e' | 'component' | null): OptionDefaultValues {
  return defaultValues
}

export function validate <C extends object> (cfg: C, onErr: (msg: string) => void) {
  debug('validating configuration', cfg)

  _.each(cfg, (value: any, key: keyof OptionDefaultValues) => {
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

export function getBreakingKeys () {
  return breakingKeys
}

export function getDefaultValues (runtimeOptions = {}) {
  // Default values can be functions, in which case they are evaluated
  // at runtime - for example, slowTestThreshold where the default value
  // varies between e2e and component testing.
  return _.mapValues(defaultValues, (value) => (typeof value === 'function' ? value(runtimeOptions) : value))
}

export function getPublicConfigKeys () {
  return publicConfigKeys
}

export function validateNoBreakingConfig (cfg, onWarning, onErr) {
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
}
