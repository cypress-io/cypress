const _ = require('lodash')
const toBoolean = require('underscore.string/toBoolean')

const isValue = (value) => {
  return (comparison) => {
    return _.invoke(comparison, 'toString') === value
  }
}

module.exports = function (value) {
  const num = _.toNumber(value)
  const bool = toBoolean(value)

  return _
  .chain([num, bool])
  .find(isValue(value))
  .defaultTo(value)
  .value()
}
