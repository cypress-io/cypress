/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const errors = require('../errors')

//# validation functions take a key and a value and should:
//#  - return true if it passes validation
//#  - return a error message if it fails validation

const errMsg = (key, value, type) => {
  return `Expected '${key}' to be ${type}. Instead the value was: ${JSON.stringify(value)}`
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

module.exports = {
  isNumber (key, value) {
    if ((value == null) || isNumber(value)) {
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
    if ((value == null) || isFullyQualifiedUrl(value)) {
      return true
    }

    return errMsg(key, value, 'a fully qualified URL (starting with http:// or https://)')

  },

  isBoolean (key, value) {
    if ((value == null) || _.isBoolean(value)) {
      return true
    }

    return errMsg(key, value, 'a boolean')

  },

  isPlainObject (key, value) {
    if ((value == null) || _.isPlainObject(value)) {
      return true
    }

    return errMsg(key, value, 'a plain object')

  },

  isString (key, value) {
    if ((value == null) || isString(value)) {
      return true
    }

    return errMsg(key, value, 'a string')

  },

  isArray (key, value) {
    if ((value == null) || isArray(value)) {
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
}
