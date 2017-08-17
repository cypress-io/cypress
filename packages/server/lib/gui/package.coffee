_       = require("lodash")
Promise = require("bluebird")
json    = require("@packages/root")

module.exports = (options) ->
  Promise.resolve(
    ## TODO: omit anything from options which is a function
    _.extend {}, options, _.pick(json, "version")
  )
