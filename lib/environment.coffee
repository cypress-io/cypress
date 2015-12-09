fs = require("fs-extra")

## never cut off stack traces
Error.stackTraceLimit = Infinity

## cannot use relative require statement
## here because when obfuscated package
## would not be available
pkg = process.cwd() + "/package.json"

getEnv = ->
  ## instead of setting NODE_ENV we will
  ## use our own separate CYPRESS_ENV so
  ## as not to conflict with CI providers

  ## use env from package first
  ## or development as default
  process.env["CYPRESS_ENV"] or= fs.readJsonSync(pkg).env ? "development"

module.exports = getEnv()
