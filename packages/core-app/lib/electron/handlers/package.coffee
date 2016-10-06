_       = require("lodash")
fs      = require("fs-extra")
path    = require("path")
Promise = require("bluebird")
cwd     = require("../../cwd")

fs        = Promise.promisifyAll(fs)
pathToPkg = cwd("package.json")

module.exports = (options) ->
  fs.readJsonAsync(pathToPkg)
  .then (json) ->
    ## TODO: omit anything from options which is a function
    _.extend {}, options, _.pick(json, "version")