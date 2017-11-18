_                      = require("lodash")
fs                     = require("fs-extra")
EE                     = require("events")
path                   = require("path")
Promise                = require("bluebird")
babelify               = require("babelify")
watchify               = require("watchify")
browserify             = require("browserify")
replaceExt             = require("replace-ext")
presetReact            = require("babel-preset-react")
presetLatest           = require("babel-preset-latest")
stringStream           = require("string-to-stream")
pluginAddModuleExports = require("babel-plugin-add-module-exports")
cjsxify                = require("./cjsxify")
appData                = require("./app_data")
{ toHashName }         = require('./saved_state')
log                    = require('debug')('cypress:server:bundle')
PrettyError            = require('pretty-error')
pe = new PrettyError()
pe.skipNodeFiles()

fs = Promise.promisifyAll(fs)

builtFiles = {}

module.exports = {
  ## for testing purposes
  reset: ->
    builtFiles = {}

  outputPath: (projectRoot = "", filePath) ->
    appData.projectsPath(toHashName(projectRoot), "bundles", filePath)

  getCache: (file) ->
    try
      return require(file)
    catch err
      return {}

  getStats: (file) ->
    try
      return fs.statSync(file)
    catch err
      return false

  build: (filePath, config) ->
    if config.isTextTerminal and built = builtFiles[filePath]
      return built

    log "bundler for project #{config.projectRoot} for file #{filePath}"

    emitter = new EE()

    absolutePath = path.join(config.projectRoot, filePath)
    log "input absolute path #{absolutePath}"

    outputPath = @outputPath(config.projectRoot, filePath)
    log "output path #{outputPath}"

    cachePath = replaceExt(outputPath, '.json')
    log "cache path #{cachePath}"

    cache = {}

    cachedFiles = [];
    ## we check if any of the files in the cache has been modified or deleted and if so we remove it from the cache
    cacheStats = @getStats(cachePath)
    if cacheStats
      cacheModTime = cacheStats.mtime.getTime()
      cache = @getCache(cachePath)
      Object.keys(cache).forEach (file) =>
        invalid = true
        stats = @getStats(file)
        if stats
          fileModTime = stats.mtime.getTime()
          if fileModTime <= cacheModTime
            invalid = false

        if invalid
          log("browserify: File #{file} cache invalid. Removing from cache")
          delete cache[file]
        else
          cachedFiles.push(file)

    bundler = browserify({
      entries:      [absolutePath]
      extensions:   [".js", ".jsx", ".coffee", ".cjsx"]
      cache: cache,
      packageCache: {}
    })

    if not config.isTextTerminal and config.watchForFileChanges
      @_watching = true ## for testing purposes

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

      ## cached files are not read so no 'file' event is emitted for them. We emit it now manually so that watchify watches them
      cachedFiles.forEach (file) ->
        bundler.emit('file', file)

    bundle = =>
      new Promise (resolve, reject) =>
        log "making bundle #{outputPath}"

        onError = (err) =>
          if config.isTextTerminal
            err.filePath = absolutePath
            ## backup the original stack before its
            ## potentially modified from bluebird
            err.originalStack = err.stack
            reject(err)
          else
            ws = fs.createWriteStream(outputPath)
            ws.on "finish", ->
              log("browserify: send error to client: #{err.stack}")
              resolve()
            ws.on "error", ->
              log("browserify: failed to send error to client: #{err.stack}")
              resolve()

            stringStream(@clientSideError(err))
            .pipe(ws)

        ws = fs.createWriteStream(outputPath)
        ws.on "finish", ->
          log("browserify: finished bundling #{outputPath}")
          fs.outputJsonAsync(cachePath, bundler._options.cache)
            .then ->
              log("browserify: saved cache #{cachePath}")
            .catch ->
              log("browserify: error saving cache file #{cachePath}")
            .finally ->
              resolve()

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

    bundler.on "update", (filePaths) ->
      latestBundle = bundle().then ->
        for updatedFilePath in filePaths
          emitter.emit("update", updatedFilePath)
        return

    latestBundle = fs.ensureDirAsync(path.dirname(outputPath)).then(bundle)

    return builtFiles[filePath] = {
      ## set to empty function in the case where we
      ## are not watching the bundle
      close: bundler.close ? ->

      getLatestBundle: -> latestBundle

      addChangeListener: (onChange) ->
        emitter.on "update", onChange
    }

  errorMessage: (err = {}) ->
    (err.stack ? err.annotated ? err.message ? err.toString())
    ## strip out stack noise from parser like
    ## at Parser.pp$5.raise (/path/to/node_modules/babylon/lib/index.js:4215:13)
    .replace(/\n\s*at.*/g, "")
    .split("From previous event:\n").join("")
    .split("From previous event:").join("")

  clientSideError: (err) ->
    console.error(pe.render(err))
    err = @errorMessage(err)
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

}
