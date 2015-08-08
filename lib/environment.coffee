pkg = require("../package.json")

getEnv = ->
  ## instead of setting NODE_ENV we will
  ## use our own separate CYPRESS_ENV so
  ## as not to conflict with CI providers

  ## use env from package first
  ## or development as default
  process.env["CYPRESS_ENV"] ?= pkg.env ? "development"

module.exports = getEnv()
