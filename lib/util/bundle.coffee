_                      = require("lodash")
fs                     = require("fs-extra")
EE                     = require("events")
str                    = require("underscore.string")
path                   = require("path")
through                = require("through")
cjsxify                = require("cjsxify")
Promise                = require("bluebird")
babelify               = require("babelify")
watchify               = require("watchify")
browserify             = require("browserify")
presetReact            = require("babel-preset-react")
presetLatest           = require("babel-preset-latest")
stringStream           = require("string-to-stream")
pluginAddModuleExports = require("babel-plugin-add-module-exports")
appData                = require("./app_data")

fs = Promise.promisifyAll(fs)

stringStream = (contents) ->
  stream = new ReadableStream()
  stream._read = ->
  stream.push(contents)
  stream.push(null)
  return stream

module.exports = {
  build: (filePath, config, watch = false) ->
    emitter = new EventEmitter()

    absolutePath = path.join(config.projectRoot, filePath)

    bundler = browserify({
      entries: [absolutePath]
      extensions: [".js", ".jsx", ".coffee", ".cjsx"]
      cache: {}
      packageCache: {}
      plugin: if watch then [watchify] else []
    })

    bundle = =>
      new Promise (resolve, reject) =>
        outputPath = appData.path("bundles", filePath)
        fs.ensureDirAsync(path.dirname(outputPath))
        .then =>
          bundler
          .bundle()
          .on "error", (err) =>
            if watch
              stringStream(@clientSideError(err)).pipe(fs.createWriteStream(outputPath))
              resolve()
            else
              reject(err)
          .on "end", ->
            resolve()
          .pipe(fs.createWriteStream(outputPath))

    bundler
    .transform(cjsxify)
    .transform(babelify, {
      ast: false
      plugins: [pluginAddModuleExports]
      presets: [presetLatest, presetReact]
    })
    ## necessary for enzyme
    ## https://github.com/airbnb/enzyme/blob/master/docs/guides/browserify.md
    ## TODO: push this into userland through configuration?
    .external([
      "react/addons"
      "react/lib/ReactContext"
      "react/lib/ExecutionEnvironment"
    ])

    if watch
      bundler.on "update", (filePaths) ->
        latestBundle = bundle().then ->
          for updatedFilePath in filePaths
            emitter.emit("update", updatedFilePath)
          return

    latestBundle = bundle()

    return {
      close: bundler.close
      getLatestBundle: -> latestBundle
      addChangeListener: (onChange) ->
        emitter.on "update", onChange
    }

  errorMessage: (err = "") ->
    (err.stack or err.annotated or err.message or err)
    ## strip out stack noise from parser like
    ## at Parser.pp$5.raise (/path/to/node_modules/babylon/lib/index.js:4215:13)
    .replace(/\n\s*at.*/g, '')

  clientSideError: (err) ->
    err = @errorMessage(err)
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
        error: "#{err}"
      })
    }())
    """

}
