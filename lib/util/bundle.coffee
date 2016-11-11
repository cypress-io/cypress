EventEmitter = require("events").EventEmitter
fs = require("fs-extra")
path = require("path")
ReadableStream = require("stream").Readable

_ = require("lodash")
through = require("through")
Promise = require("bluebird")
str = require("underscore.string")

browserify = require("browserify")
babelify = require("babelify")
cjsxify = require("cjsxify")
watchify = require("watchify")

pluginAddModuleExports = require("babel-plugin-add-module-exports")
presetLatest = require("babel-preset-latest")
presetReact = require("babel-preset-react")

appData = require("./app_data")

fs = Promise.promisifyAll(fs)

stringStream = (contents) ->
  stream = new ReadableStream()
  stream._read = ->
  stream.push(contents)
  stream.push(null)
  return stream

module.exports = {
  watch: (filePath, config) ->
    emitter = new EventEmitter()

    absolutePath = path.join(config.projectRoot, filePath)

    bundler = browserify({
      entries: [absolutePath]
      extensions: [".js", ".jsx", ".coffee", ".cjsx"]
      cache: {}
      packageCache: {}
      plugin: [watchify]
    })

    bundle = =>
      new Promise (resolve, reject) =>
        outputPath = appData.path("bundles", filePath)
        fs.ensureDirAsync(path.dirname(outputPath))
        .then =>
          bundler
          .bundle()
          .on "error", (err) =>
            stringStream(@error(err)).pipe(fs.createWriteStream(outputPath))
            resolve()
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
    .on "update", (filePaths) ->
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

  error: (err) ->
    if not err or not _.isObject(err)
      err = {
        name: "Uncaught Error"
        message: ""
        stack: err
      }

    err.stack = (err.stack or err.annotated or err.message or "")
      ## \n doesn't come through properly so preserve it so the
      ## runner can do the right thing
      .replace(/\n/g, '{newline}')
      ## babel adds syntax highlighting for the console in the form of
      ## [90m that need to be stripped out or they appear in the error message
      .replace(/\[\d{1,3}m/g, '')

    """
    (function () {
      Cypress.trigger("bundle:error", {
        name: "#{err.name}",
        message: "#{err.message}",
        stack: "#{err.stack}"
      })
    }())
    """

}
