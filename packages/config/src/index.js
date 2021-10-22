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

module.exports = {
  allowed: (obj = {}) => {
    const propertyNames = publicConfigKeys.concat(breakingKeys)

    return _.pick(obj, propertyNames)
  },

  getBreakingKeys: () => {
    return breakingKeys
  },

  getDefaultValues: () => {
    return defaultValues
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
  },

  validateNoBreakingConfig: (cfg, onWarning, onErr) => {
    return _.each(breakingOptions, ({ name, errorKey, newName, isWarning }) => {
      if (_.has(cfg, name)) {
        if (isWarning) {
          return onWarning(errorKey, name, newName)
        }

        return onErr(errorKey, name, newName)
      }
    })
  },
}
