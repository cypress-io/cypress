_ = require("lodash")
fs = require("fs-extra")
path = require("path")
Promise = require("bluebird")
babelify = require("babelify")
watchify = require("watchify")
browserify = require("browserify")
presetReact = require("babel-preset-react")
presetLatest = require("babel-preset-latest")
pluginAddModuleExports = require("babel-plugin-add-module-exports")
cjsxify = require("./cjsxify")
log = require('debug')('cypress:server:preprocessor')

fs = Promise.promisifyAll(fs)

bundles = {}
counts = {}

module.exports = (config, emitter, util) ->
  return (filePath) ->
    if b = bundles[filePath]
      log("browserify: already have bundle for #{filePath}")
      return b

    outputPath = util.getOutputPath(filePath)

    log("browserify:")
    log("- input: #{filePath}")
    log("- output: #{outputPath}")

    bundler = browserify({
      entries:      [filePath]
      extensions:   [".js", ".jsx", ".coffee", ".cjsx"]
      cache:        {}
      packageCache: {}
    })

    if config.shouldWatch
      log("browserify: watching")
      bundler.plugin(watchify, {
        ignoreWatch: [
          "**/.git/**"
          "**/.nyc_output/**"
          "**/.sass-cache/**"
          "**/bower_components/**"
          "**/coverage/**"
          "**/node_modules/**"
        ]
      })

    bundle = ->
      new Promise (resolve, reject) =>
        log("browserify: making bundle #{outputPath}")

        onError = (err) =>
          err.filePath = filePath
          ## backup the original stack before its
          ## potentially modified from bluebird
          err.originalStack = err.stack
          log("browserify: errored bundling #{outputPath}", err)
          reject(err)

        ws = fs.createWriteStream(outputPath)
        ws.on "finish", ->
          log("browserify: finished bundling #{outputPath}")
          resolve(outputPath)
        ws.on("error", onError)

        bundler
        .bundle()
        .on("error", onError)
        .pipe(ws)

    bundler
    .transform(cjsxify)
    .transform(babelify, {
      ast: false
      babelrc: false
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

    bundler.on "update", ->
      log("browserify: update #{filePath}")
      bundles[filePath] = bundle().tap ->
        log("- update finished for #{filePath}")
        emitter.emit("update:#{filePath}", filePath)

    close = ->
      log("browserify: close #{filePath}")
      delete bundles[filePath]
      bundler.close()

    emitter.on("close", close)
    emitter.on("close:#{filePath}", close)

    bundles[filePath] = fs.ensureDirAsync(path.dirname(outputPath)).then(bundle)

    return bundles[filePath]
