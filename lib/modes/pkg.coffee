fs      = require("fs-extra")
path    = require("path")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

module.exports = ->
  fs.readJsonAsync path.join(process.cwd(), "package.json")
