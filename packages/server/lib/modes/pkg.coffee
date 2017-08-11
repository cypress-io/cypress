Promise = require("bluebird")
pkg     = require("@packages/root")

module.exports = ->
  Promise.resolve(pkg)
