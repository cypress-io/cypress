require("./util/http_overrides")
require("./util/fs")

os      = require("os")
cwd     = require("./cwd")
Promise = require("bluebird")

## never cut off stack traces
Error.stackTraceLimit = Infinity

## cannot use relative require statement
## here because when obfuscated package
## would not be available
pkg = require("@packages/root")

try
  ## i wish we didn't have to do this but we have to append
  ## these command line switches immediately
  app = require("electron").app
  app.commandLine.appendSwitch("disable-renderer-backgrounding", true)
  app.commandLine.appendSwitch("ignore-certificate-errors", true)
  ## this should really only be necessary when 
  ## running Chromium versions >= 72
  ## https://github.com/cypress-io/cypress/issues/1872
  app.commandLine.appendSwitch("proxy-bypass-list", "<-loopback>")

  if os.platform() is "linux"
    app.disableHardwareAcceleration()

## instead of setting NODE_ENV we will
## use our own separate CYPRESS_ENV so
## as not to conflict with CI providers

## use env from package first
## or development as default
env = process.env["CYPRESS_ENV"] or= pkg.env ? "development"

config = {
  ## uses cancellation for automation timeouts
  cancellation: true
}

if env is "dev"
  ## enable long stack traces in dev
  config.longStackTraces = true

Promise.config(config)

module.exports = env
