_ = require("lodash")
EE = require("events")
path = require("path")
debug = require("debug")("cypress:server:preprocessor")
Promise = require("bluebird")
appData = require("../util/app_data")
cwd = require("../cwd")
plugins = require("../plugins")
savedState = require("../util/saved_state")

errorMessage = (err = {}) ->
  (err.stack ? err.annotated ? err.message ? err.toString())
  ## strip out stack noise from parser like
  ## at Parser.pp$5.raise (/path/to/node_modules/babylon/lib/index.js:4215:13)
  .replace(/\n\s*at.*/g, "")
  .replace(/From previous event:\n?/g, "")

clientSideError = (err) ->
  console.log(err.stack)

  err = errorMessage(err)
  ## \n doesn't come through properly so preserve it so the
  ## runner can do the right thing
  .replace(/\n/g, '{newline}')
  ## babel adds syntax highlighting for the console in the form of
  ## [90m that need to be stripped out or they appear in the error message
  .replace(/\[\d{1,3}m/g, '')

  """
  (function () {
    Cypress.action("spec:script:error", {
      type: "BUNDLE_ERROR",
      error: #{JSON.stringify(err)}
    })
  }())
  """

getOutputPath = (config, filePath) ->
  appData.projectsPath(savedState.toHashName(config.projectRoot), "bundles", filePath)

baseEmitter = new EE()
fileObjects = {}
fileProcessors = {}

setDefaultPreprocessor = ->
  debug("set default preprocessor")

  browserify = require("@cypress/browserify-preprocessor")
  plugins.register("file:preprocessor", browserify())

plugins.registerHandler (ipc) ->
  ipc.on "preprocessor:rerun", (filePath) ->
    debug("ipc preprocessor:rerun event")
    baseEmitter.emit("file:updated", filePath)

  baseEmitter.on "close", (filePath) ->
    debug("base emitter plugin close event")
    ipc.send("preprocessor:close", filePath)

module.exports = {
  errorMessage

  clientSideError

  emitter: baseEmitter

  getFile: (filePath, config) ->
    filePath = path.resolve(config.projectRoot, filePath)

    debug("getFile #{filePath}")

    if not fileObject = fileObjects[filePath]
      ## we should be watching the file if we are NOT
      ## in a text terminal aka cypress run
      ## TODO: rename this to config.isRunMode
      ## vs config.isInterativeMode
      shouldWatch = not config.isTextTerminal
      
      baseFilePath = filePath
      .replace(config.projectRoot, "")
      .replace(config.integrationFolder, "")

      fileObject = fileObjects[filePath] = _.extend(new EE(), {
        filePath,
        shouldWatch,
        outputPath: getOutputPath(config, baseFilePath)
      })

      fileObject.on "rerun", ->
        debug("file object rerun event")
        baseEmitter.emit("file:updated", filePath)

      baseEmitter.once "close", ->
        debug("base emitter native close event")
        fileObject.emit("close")
 
    if not plugins.has("file:preprocessor")
      setDefaultPreprocessor(config)

    if config.isTextTerminal and fileProcessor = fileProcessors[filePath]
      debug("headless and already processed")
      return fileProcessor

    preprocessor = fileProcessors[filePath] = Promise.try ->
      plugins.execute("file:preprocessor", fileObject)

    return preprocessor

  removeFile: (filePath, config) ->
    filePath = path.resolve(config.projectRoot, filePath)

    return if not fileProcessors[filePath]

    debug("removeFile #{filePath}")

    baseEmitter.emit("close", filePath)

    if fileObject = fileObjects[filePath]
      fileObject.emit("close")

    delete fileObjects[filePath]
    delete fileProcessors[filePath]

  close: ->
    debug("close preprocessor")

    fileObjects = {}
    fileProcessors = {}
    baseEmitter.emit("close")
    baseEmitter.removeAllListeners()
}
