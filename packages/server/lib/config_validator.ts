import _ from 'lodash'
import errors from './errors'
import { options, breakingOptions } from './config_options'
import { createIndex } from './config_utils'

export const RESOLVED_FROM = ['plugin', 'env', 'default', 'runtime', 'config'] as const

export type ResolvedConfigurationOptionSource = typeof RESOLVED_FROM[number]

export type ResolvedFromConfig = {
  from: ResolvedConfigurationOptionSource
  value: ResolvedConfigurationOptionSource
}

export type ResolvedConfigurationOptions = Partial<{
  [x in keyof Cypress.ResolvedConfigOptions]: ResolvedFromConfig
}>

export const CYPRESS_ENV_PREFIX = 'CYPRESS_'

export const CYPRESS_ENV_PREFIX_LENGTH = 'CYPRESS_'.length

export const CYPRESS_RESERVED_ENV_VARS = [
  'CYPRESS_INTERNAL_ENV',
]

export const CYPRESS_SPECIAL_ENV_VARS = [
  'RECORD_KEY',
]

const validationRules = createIndex(options, 'name', 'validation')
const defaultValues: Record<string, any> = createIndex(options, 'name', 'defaultValue')
const onlyInOverrideValues = createIndex(options, 'name', 'onlyInOverride')

export const validateNoBreakingConfig = (cfg) => {
  return _.each(breakingOptions, ({ name, errorKey, newName, isWarning }) => {
    if (_.has(cfg, name)) {
      if (isWarning) {
        return errors.warning(errorKey, name, newName)
      }

      return errors.throw(errorKey, name, newName)
    }
  })
}

/**
 * validate a root config object
 * @param {object} cfg config object to validate
 * @param {(errMsg:string) => void} onErr function run when invalid config is found
 * @param {boolean} bypassRootLimitations skip checks related to position when we are working with merged configs
 * @returns
 */
export function validate (cfg, onErr) {
  return _.each(cfg, (value, key) => {
    const validationFn = validationRules[key]

    if (onlyInOverrideValues[key]) {
      if (onlyInOverrideValues[key] === true) {
        return onErr(`key \`${key}\` is only valid in a testingType object, it is invalid to use it in the root`)
      }

      return onErr(`key \`${key}\` is only valid in the \`${onlyInOverrideValues[key]}\` object, it is invalid to use it in the root`)
    }

    // does this key have a validation rule?
    if (validationFn) {
      // and is the value different from the default?
      if (value !== defaultValues[key]) {
        const result = validationFn(key, value)

        if (result !== true) {
          return onErr(result)
        }
      }
    }
  })
}

export const validateFile = (file) => {
  return (configObject) => {
    // disallow use of pluginFile in evaluated configuration files
    if (/\.(ts|js)$/.test(file) && configObject.pluginsFile) {
      errors.throw('CONFLICT_PLUGINSFILE_CONFIGJS', file)
    }

    return validate(configObject, (errMsg) => {
      return errors.throw('SETTINGS_VALIDATION_ERROR', file, errMsg)
    })
  }
}
