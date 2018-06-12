_ = require("lodash")
errors = require("../errors")

## validation functions take a key and a value and should:
##  - return true if it passes validation
##  - return a error message if it fails validation

errMsg = (key, value, type) ->
  "Expected '#{key}' to be #{type}. Instead the value was: #{JSON.stringify(value)}"

isFullyQualifiedUrl = (value) ->
  isString(value) and /^https?\:\/\//.test(value)

isArrayOfStrings = (value) ->
  isArray(value) and _.every(value, isString)

isFalse = (value) ->
  value is false

isArray  = _.isArray
isNumber = _.isFinite
isString = _.isString

module.exports = {
  isNumber: (key, value) ->
    if not value? or isNumber(value)
      true
    else
      errMsg(key, value, "a number")

  isNumberOrFalse: (key, value) ->
    if isNumber(value) or isFalse(value)
      true
    else
      errMsg(key, value, "a number or false")

  isFullyQualifiedUrl: (key, value) ->
    if not value? or isFullyQualifiedUrl(value)
      return true
    else
      errMsg(key, value, "a fully qualified URL (starting with http:// or https://)")

  isBoolean: (key, value) ->
    if not value? or _.isBoolean(value)
      true
    else
      errMsg(key, value, "a boolean")

  isPlainObject: (key, value) ->
    if not value? or _.isPlainObject(value)
      true
    else
      errMsg(key, value, "a plain object")

  isString: (key, value) ->
    if not value? or isString(value)
      true
    else
      errMsg(key, value, "a string")

  isArray: (key, value) ->
    if not value? or isArray(value)
      true
    else
      errMsg(key, value, "an array")

  isStringOrFalse: (key, value) ->
    if isString(value) or isFalse(value)
      true
    else
      errMsg(key, value, "a string or false")

  isStringOrArrayOfStrings: (key, value) ->
    if isString(value) or isArrayOfStrings(value)
      true
    else
      errMsg(key, value, "a string or an array of strings")
}
