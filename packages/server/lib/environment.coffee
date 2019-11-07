require("./util/fs")

os      = require("os")
##
## NOTE
##
## by loading "./cwd" we are changing the current working directory
## to the "packages/server" folder
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

  ## These flags are for webcam/WebRTC testing
  ## https://github.com/cypress-io/cypress/issues/2704
  app.commandLine.appendSwitch("use-fake-ui-for-media-stream")
  app.commandLine.appendSwitch("use-fake-device-for-media-stream")

  ## https://github.com/cypress-io/cypress/issues/2376
  app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required")

  ## allows webSecurity: false to work as expected in webPreferences
  ## https://github.com/electron/electron/issues/18214
  app.commandLine.appendSwitch("disable-site-isolation-trials")

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
