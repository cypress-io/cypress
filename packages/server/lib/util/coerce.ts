const _ = require('lodash')
const toBoolean = require('underscore.string/toBoolean')

// https://github.com/cypress-io/cypress/issues/6810
const toArray = (value) => {
  const valueIsNotStringOrArray = typeof (value) !== 'string' || (value[0] !== '[' && value[value.length - 1] !== ']')

  if (valueIsNotStringOrArray) {
    return
  }

  // '[foo,bar]' => ['foo', 'bar']
  const convertStringToArray = () => value.substring(1, value.length - 1).split(',')
  const arr = convertStringToArray()

  // The default `toString` array method returns one string containing each array element separated
  // by commas, but without '[' or ']'. If an environment variable is intended to be an array, it
  // will begin and end with '[' and ']' respectively. To correctly compare the value argument to
  // the value in `process.env`, the `toString` method must be updated to include '[' and ']'.
  // Default `toString()` on array: ['foo', 'bar'].toString() => 'foo,bar'
  // Custom `toString()` on array: ['foo', 'bar'].toString() => '[foo,bar]'
  arr.toString = () => `[${arr.join(',')}]`

  return arr
}

// https://github.com/cypress-io/cypress/issues/8818
// toArray() above doesn't handle JSON string properly.
// For example, '[{a:b,c:d},{e:f,g:h}]' isn't the parsed object but ['{a:b', 'c:d}', '{e:f', 'g:h}']. It's useless.
// Because of that, we check if the value is a JSON string.
const fromJson = (value) => {
  try {
    return JSON.parse(value)
  } catch (e) {
    // do nothing
  }
}

module.exports = (value) => {
  const num = _.toNumber(value)

  if (_.invoke(num, 'toString') === value) {
    return num
  }

  const bool = toBoolean(value)

  if (_.invoke(bool, 'toString') === value) {
    return bool
  }

  const obj = fromJson(value)

  if (obj && typeof obj === 'object') {
    return obj
  }

  const arr = toArray(value)

  if (_.invoke(arr, 'toString') === value) {
    return arr
  }

  return value
}
