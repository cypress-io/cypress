_ = require("lodash")
EE = require("events")
path = require("path")
log = require('debug')('cypress:server:preprocessor')
Promise = require("bluebird")
createPreprocessor = require("./util/browserify-preprocessor")
appData = require("./util/app_data")
{ toHashName } = require('./util/saved_state')

PrettyError = require('pretty-error')
pe = new PrettyError()
pe.skipNodeFiles()

errorMessage = (err = {}) ->
  (err.stack ? err.annotated ? err.message ? err.toString())
  ## strip out stack noise from parser like
  ## at Parser.pp$5.raise (/path/to/node_modules/babylon/lib/index.js:4215:13)
  .replace(/\n\s*at.*/g, "")
  .replace(/From previous event:\n?/g, "")

clientSideError = (err) ->
  console.error(pe.render(err))
  err = errorMessage(err)
  ## \n doesn't come through properly so preserve it so the
  ## runner can do the right thing
  .replace(/\n/g, '{newline}')
  ## babel adds syntax highlighting for the console in the form of
  ## [90m that need to be stripped out or they appear in the error message
  .replace(/\[\d{1,3}m/g, '')

  """
  (function () {
    Cypress.trigger("script:error", {
      type: "BUNDLE_ERROR",
      error: #{JSON.stringify(err)}
    })
  }())
  """

getOutputPath = (config, filePath) ->
  appData.projectsPath(toHashName(config.projectRoot), "bundles", filePath)

emitter = new EE()
preprocessor = null
fileProcessors = {}

module.exports = {
  errorMessage: errorMessage
  clientSideError: clientSideError

  prep: (config) ->
    emitter = new EE()

    preprocessorConfig = {
      shouldWatch: !config.isTextTerminal
    }

    log("prep preprocessor:", preprocessorConfig)

    util = {
      getOutputPath: _.partial(getOutputPath, config)
    }

    ## TODO: load 'createProcessor' from configured plugins instead of
    ##       harding coding the browserify one
    preprocessor = createPreprocessor(preprocessorConfig, emitter, util)

  getFile: (filePath, config, options = {}) ->
    filePath = path.join(config.projectRoot, filePath)

    log("getFile #{filePath}")

    if config.isTextTerminal and fileProcessor = fileProcessors[filePath]
      log("- headless and already processed")
      return fileProcessor

    if not preprocessor
      throw new Error("preprocessor must be prepped before getting file")

    if _.isFunction(options.onChange)
      log("- add update listener for #{filePath}")
      emitter.on("update:#{filePath}", options.onChange)

    fileProcessors[filePath] = Promise.resolve(preprocessor(filePath))

    return fileProcessors[filePath]

  removeFile: (filePath) ->
    return if not fileProcessors[filePath]

    log("removeFile #{filePath}")
    emitter.emit("close:#{filePath}")
    delete fileProcessors[filePath]

  close: ->
    log("close preprocessor")

    preprocessor = null
    fileProcessors = {}
    emitter.emit("close")
    emitter.removeAllListeners()

}
