const _ = require('lodash')
const Promise = require('bluebird')

module.exports = (options) => {
  return Promise.try(() => {
    return _.toNumber(options.exitWithCode)
  })
}
