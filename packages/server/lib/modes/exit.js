_       = require("lodash")
Promise = require("bluebird")

module.exports = (options) ->
  Promise.try ->
    _.toNumber(options.exitWithCode)
