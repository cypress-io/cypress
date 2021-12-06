const _ = require('lodash')
const debug = require('debug')('cypress:config:validator')

const { options, breakingOptions } = require('./options')

const dashesOrUnderscoresRe = /^(_-)+/

// takes an array and creates an index object of [keyKey]: [valueKey]
const createIndex = (arr, keyKey, valueKey) => {
  return _.reduce(arr, (memo, item) => {
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

module.exports = {
  allowed: (obj = {}) => {
    const propertyNames = publicConfigKeys.concat(breakingKeys)

    return _.pick(obj, propertyNames)
  },

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

  validate: (cfg, onErr) => {
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
  },

  validateNoBreakingConfig: (cfg, onWarning, onErr) => {
    breakingOptions.forEach(({ name, errorKey, newName, isWarning, value }) => {
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

  validateNoReadOnlyConfig: (config, onErr) => {
    let errProperty

    Object.keys(config).some((option) => {
      return errProperty = testConfigOverrideOptions[option] === false ? option : undefined
    })

    if (errProperty) {
      return onErr(errProperty)
    }
  },
}
