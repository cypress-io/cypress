fs      = require("fs-extra")
path    = require("path")
Promise = require("bluebird")
cwd     = require("../cwd")

fs = Promise.promisifyAll(fs)

module.exports = ->
  fs.readJsonAsync cwd("package.json")
