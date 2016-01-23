_       = require("lodash")
fs      = require("fs-extra")
path    = require("path")
Promise = require("bluebird")

fs        = Promise.promisifyAll(fs)
pathToPkg = path.join(process.cwd(), "package.json")

module.exports = (options) ->
  fs.readJsonAsync(pathToPkg)
  .then (json) ->
    _.extend {}, options, _.pick(json, "version")