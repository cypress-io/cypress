const _ = require('lodash')

function snakeCase (string) {
  return _.snakeCase(string)
}

snakeCase.add = (a, b) => a + b

module.exports = snakeCase
