const _ = require('lodash')
const debug = require('debug')('cypress:server:validation')
const is = require('check-more-types')
const { commaListsOr } = require('common-tags')

// validation functions take a key and a value and should:
//  - return true if it passes validation
//  - return a error message if it fails validation

const str = JSON.stringify

/**
 * Forms good Markdown-like string message.
 * @param {string} key - The key that caused the error
 * @param {string} type - The expected type name
 * @param {any} value - The actual value
 * @returns {string} Formatted error message
*/
const errMsg = (key, value, type) => {
  return `Expected \`${key}\` to be ${type}. Instead the value was: \`${str(
    value,
  )}\``
}

const isFullyQualifiedUrl = (value) => {
  return isString(value) && /^https?\:\/\//.test(value)
}

const isArrayOfStrings = (value) => {
  return isArray(value) && _.every(value, isString)
}

const isFalse = (value) => {
  return value === false
}

const { isArray } = _
const isNumber = _.isFinite
const { isString } = _

/**
 * Validates a single browser object.
 * @returns {string|true} Returns `true` if the object is matching browser object schema. Returns an error message if it does not.
 */
const isValidBrowser = (browser) => {
  if (!is.unemptyString(browser.name)) {
    return errMsg('name', browser, 'a non-empty string')
  }

  // TODO: this is duplicated with browsers/index
  const knownBrowserFamilies = ['chromium', 'firefox']

  if (!is.oneOf(knownBrowserFamilies)(browser.family)) {
    return errMsg('family', browser, commaListsOr`either ${knownBrowserFamilies}`)
  }

  if (!is.unemptyString(browser.displayName)) {
    return errMsg('displayName', browser, 'a non-empty string')
  }

  if (!is.unemptyString(browser.version)) {
    return errMsg('version', browser, 'a non-empty string')
  }

  if (!is.string(browser.path)) {
    return errMsg('path', browser, 'a string')
  }

  if (!is.string(browser.majorVersion) && !is.positive(browser.majorVersion)) {
    return errMsg('majorVersion', browser, 'a string or a positive number')
  }

  return true
}

/**
 * Validates the list of browsers.
 */
const isValidBrowserList = (key, browsers) => {
  debug('browsers %o', browsers)
  if (!browsers) {
    return 'Missing browsers list'
  }

  if (!Array.isArray(browsers)) {
    debug('browsers is not an array', typeof browsers)

    return 'Browsers should be an array'
  }

  if (!browsers.length) {
    return 'Expected at least one browser'
  }

  for (let k = 0; k < browsers.length; k += 1) {
    const err = isValidBrowser(browsers[k])

    if (err !== true) {
      return `Found an error while validating the \`browsers\` list. ${err}`
    }
  }

  return true
}

const isValidRetriesConfig = (key, value) => {
  const optionalKeys = ['runMode', 'openMode']
  const isValidRetryValue = (val) => _.isNull(val) || (Number.isInteger(val) && val >= 0)
  const optionalKeysAreValid = (val, k) => optionalKeys.includes(k) && isValidRetryValue(val)

  if (isValidRetryValue(value)) {
    return true
  }

  if (_.isObject(value) && _.every(value, optionalKeysAreValid)) {
    return true
  }

  return errMsg(key, value, 'a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls')
}

const isValidFirefoxGcInterval = (key, value) => {
  const isIntervalValue = (val) => {
    if (isNumber(val)) {
      return val >= 0
    }

    return val == null
  }

  if (isIntervalValue(value)
      || (_.isEqual(_.keys(value), ['runMode', 'openMode'])
          && isIntervalValue(value.runMode)
          && isIntervalValue(value.openMode))) {
    return true
  }

  return errMsg(key, value, 'a positive number or null or an object with "openMode" and "runMode" as keys and positive numbers or nulls as values')
}

const isOneOf = (...values) => {
  return (key, value) => {
    if (values.some((v) => {
      if (typeof value === 'function') {
        return value(v)
      }

      return v === value
    })) {
      return true
    }

    const strings = values.map(str).join(', ')

    return errMsg(key, value, `one of these values: ${strings}`)
  }
}

module.exports = {
  isValidBrowser,

  isValidBrowserList,

  isValidFirefoxGcInterval,

  isValidRetriesConfig,

  isNumber (key, value) {
    if (value == null || isNumber(value)) {
      return true
    }

    return errMsg(key, value, 'a number')
  },

  isNumberOrFalse (key, value) {
    if (isNumber(value) || isFalse(value)) {
      return true
    }

    return errMsg(key, value, 'a number or false')
  },

  isFullyQualifiedUrl (key, value) {
    if (value == null || isFullyQualifiedUrl(value)) {
      return true
    }

    return errMsg(
      key,
      value,
      'a fully qualified URL (starting with `http://` or `https://`)',
    )
  },

  isBoolean (key, value) {
    if (value == null || _.isBoolean(value)) {
      return true
    }

    return errMsg(key, value, 'a boolean')
  },

  isPlainObject (key, value) {
    if (value == null || _.isPlainObject(value)) {
      return true
    }

    return errMsg(key, value, 'a plain object')
  },

  isString (key, value) {
    if (value == null || isString(value)) {
      return true
    }

    return errMsg(key, value, 'a string')
  },

  isArray (key, value) {
    if (value == null || isArray(value)) {
      return true
    }

    return errMsg(key, value, 'an array')
  },

  isStringOrFalse (key, value) {
    if (isString(value) || isFalse(value)) {
      return true
    }

    return errMsg(key, value, 'a string or false')
  },

  isStringOrArrayOfStrings (key, value) {
    if (isString(value) || isArrayOfStrings(value)) {
      return true
    }

    return errMsg(key, value, 'a string or an array of strings')
  },

  /**
   * Checks if given value for a key is equal to one of the provided values.
   * @example
    ```
    validate = v.isOneOf("foo", "bar")
    validate("example", "foo") // true
    validate("example", "else") // error message string
    ```
   */
  isOneOf,
}
