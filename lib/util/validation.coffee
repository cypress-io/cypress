_ = require("lodash")
errors = require("../errors")

## validation functions take a key and a value and should:
##  - return true if it passes validation
##  - return an error message if it fails validation

error = (key, value, type) ->
  "Expected '#{key}' to be #{type}. Instead the value was: #{JSON.stringify(value)}"

isFullyQualifiedUrl = (value) ->
  _.isString(value) and /^https?\:\/\//.test(value)

isArrayOfStrings = (value) ->
  _.isArray(value) and _.every(value, _.isString)

module.exports = {
  isNumber: (key, value) ->
    if not value? or _.isNumber(value)
      true
    else
      error(key, value, "a number")

  isFullyQualifiedUrl: (key, value) ->
    if not value? or isFullyQualifiedUrl(value)
      return true
    else
      error(key, value, "a fully qualified URL (starting with http:// or https://)")

  isBoolean: (key, value) ->
    if not value? or _.isBoolean(value)
      true
    else
      error(key, value, "a boolean")

  isPlainObject: (key, value) ->
    if not value? or _.isPlainObject(value)
      true
    else
      error(key, value, "a plain object")

  isString: (key, value) ->
    if not value? or _.isString(value)
      true
    else
      error(key, value, "a string")

  isArray: (key, value) ->
    if not value? or _.isArray(value)
      true
    else
      error(key, value, "an array")

  isStringOrFalse: (key, value) ->
    if not value? or _.isString(value) or value is false
      true
    else
      error(key, value, "a string or false")

  isStringOrArrayOfStrings: (key, value) ->
    if not value? or _.isString(value) or isArrayOfStrings(value)
      true
    else
      error(key, value, "a string or an array of strings")
}
