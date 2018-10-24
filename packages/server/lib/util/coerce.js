const _ = require('lodash')
const toBoolean = require('underscore.string/toBoolean')

const isValue = (value) => {
  return _.invoke(value, 'toString') === value
}

module.exports = function (value) {
  const num = _.toNumber(value)
  const bool = toBoolean(value)

  return _.find([num, bool], isValue) || value
}
