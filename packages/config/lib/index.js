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
  validateNoReadOnlyConfigEmily: (config) => {
    console.log('config', config)
    const writeableOptions = options.filter((option) => option.isWriteable).map((option) => option.name)

    let errMessage

    Object.keys(config).forEach((element) => {
      console.log('emily', config, element)
      console.log('emily', writeableOptions)
      console.log('emily', writeableOptions.includes(element))
      if (!writeableOptions.includes(element)) {
        console.log('return error')

        errMessage = `The configuration option \`${element}\` cannot be mutated because it is a read-only property.`
        // throw new Error)
      }
    })

    return errMessage
  },
  validateNoReadOnlyConfig: (func) => {
    const writeableOptions = options.filter((option) => option.isWriteable).map((option) => option.name)

    return function (...args) {
      switch (args.length) {
        case 0:
          func()
          break
        case 1:
          if (_.isString(args[0])) {
            func(...args)
            break
          }

          if (_.isObject(args[0])) {
            Object.keys(args[0]).forEach((element) => {
              if (!writeableOptions.includes(element)) {
                return `The configuration option \`${element}\` cannot be mutated because it is a read-only property.`
                // throw new Error)
              }
            })
          }

          func(...args)
          break
        default:
          if (!writeableOptions.includes(args[0])) {
            return `The configuration option \`${args[0]}}\` cannot be mutated because it is a read-only property.`
            throw new Error(`The configuration option \`${args[0]}\` cannot be mutated because it is a read-only property.`)
          }

          func(...args)
      }
    }
  },
}
