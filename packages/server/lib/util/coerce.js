const _ = require('lodash')
const toBoolean = require('underscore.string/toBoolean')

const isValue = (value) => {
  return (comparison) => {
    return _.invoke(comparison, 'toString') === value
  }
}

const toArray = (value) => {
  if (typeof (value) !== 'string' || (value[0] !== '[' && value[value.length - 1] !== ']')) {
    return
  }

  const arr = value.substring(1, value.length - 1).split(',')

  // The default `toString` array method returns one string containing each array element separated
  // by commas, but without '[' or ']'. If an environment variable is intended to be an array, it
  // will begin and end with '[' and ']' respectively. To correctly compare the value argument to
  // the value in `process.env`, the `toString` method must be updated to include '[' and ']'.
  arr.toString = () => `[${arr.join(',')}]`

  return arr
}

module.exports = (value) => {
  const num = _.toNumber(value)
  const bool = toBoolean(value)
  const arr = toArray(value)

  return _
  .chain([num, bool, arr])
  .find(isValue(value))
  .defaultTo(value)
  .value()
}
