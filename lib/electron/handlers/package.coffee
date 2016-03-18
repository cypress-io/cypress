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
    _.extend {}, options, _.pick(json, "version")