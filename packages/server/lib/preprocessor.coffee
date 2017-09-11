_ = require("lodash")
EE = require("events")
path = require("path")
log = require("debug")("cypress:server:preprocessor")
Promise = require("bluebird")
babelify = require("babelify")
cjsxify = require("./util/cjsxify")

presetReact            = require("babel-preset-react")
presetLatest           = require("babel-preset-latest")
pluginAddModuleExports = require("babel-plugin-add-module-exports")

appData = require("./util/app_data")
cwd = require("./cwd")
plugins = require("./plugins")
{ toHashName } = require("./util/saved_state")

PrettyError = require("pretty-error")
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
    Cypress.action("spec:script:error", {
      type: "BUNDLE_ERROR",
      error: #{JSON.stringify(err)}
    })
  }())
  """

getOutputPath = (config, filePath) ->
  appData.projectsPath(toHashName(config.projectRoot), "bundles", filePath)

emitter = new EE()
fileProcessors = {}

setDefaultPreprocessor = ->
  log("set default preprocessor")

  browserify = require("cypress-browserify-preprocessor")
  plugins.register "on:spec:file:preprocessor", browserify({
    extensions: [".js", ".jsx", ".coffee", ".cjsx"]
    ignoreWatch: [
      "**/.git/**"
      "**/.nyc_output/**"
      "**/.sass-cache/**"
      "**/bower_components/**"
      "**/coverage/**"
      "**/node_modules/**"
    ]
    onBundle: (bundle) ->
      log("bundle received")
      bundle.transform(cjsxify)
      bundle.transform(babelify, {
        ast: false
        babelrc: false
        plugins: [pluginAddModuleExports]
        presets: [presetLatest, presetReact]
      })
  })

module.exports = {
  errorMessage: errorMessage
  clientSideError: clientSideError

  getFile: (filePath, config, options = {}) ->
    filePath = path.join(config.projectRoot, filePath)

    log("getFile #{filePath}")

    preprocessorOptions = {
      shouldWatch: !config.isTextTerminal
    }

    util = {
      getOutputPath: _.partial(getOutputPath, config)
      onClose: (cb) ->
        emitter.on("close:#{filePath}", cb)
        emitter.on("close", cb)
    }

    log("prep preprocessor:", preprocessorOptions)

    if not plugins.has("on:spec:file:preprocessor")
      setDefaultPreprocessor()

    if config.isTextTerminal and fileProcessor = fileProcessors[filePath]
      log("- headless and already processed")
      return fileProcessor

    if _.isFunction(options.onChange)
      log("- add update listener for #{filePath}")

      util.fileUpdated = (changedFilePath) ->
        if changedFilePath is filePath
          options.onChange(changedFilePath)

    preprocessor = Promise.resolve(
      plugins.execute("on:spec:file:preprocessor", filePath, preprocessorOptions, util)
    )

    fileProcessors[filePath] = preprocessor

    return preprocessor

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
