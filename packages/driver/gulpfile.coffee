_             = require("lodash")
$             = require("gulp-load-plugins")()
gulp          = require("gulp")
path          = require("path")
Promise       = require("bluebird")
runSequence   = require("run-sequence")
browserify    = require("browserify")
coffeeify     = require("coffeeify")
watchify      = require("watchify")
resolutions   = require("browserify-resolutions")
source        = require("vinyl-source-stream")
fs            = Promise.promisifyAll(require("fs-extra"))

log = (obj = {}) ->
  args = [
    "\n{",
    "\n\tname:       #{$.util.colors.yellow(obj.name)}",
    "\n\tplugin:     #{$.util.colors.blue(obj.plugin)}",
    "\n\tmessage:    #{$.util.colors.red(obj.message)}",
    "\n\tfileName:   #{obj.fileName}",
    "\n\tlineNumber: #{obj.lineNumber}",
    "\n\tstack:      #{obj.stack}" if obj.showStack,
    "\n}"
  ]
  $.util.log _.compact(args)...
  $.util.beep()

jsOptions = {
  entries: ["src/main.coffee"]
  extensions: [".coffee", ".js"]
  destination: "dist"
  outputName: "driver.js"
}

integrationSpecHelperOptions = {
  entries: ["test/support/integration_spec_helper.coffee"]
  extensions: [".coffee", ".js"]
  destination: "dist-test"
  outputName: "spec_helper.js"
}

specIndexOptions = {
  entries: ["test/support/client/spec_index.coffee"]
  extensions: [".coffee", ".js"]
  destination: "dist-test"
  outputName: "spec_index.js"
}

specRunnerOptions = {
  entries: ["test/support/client/runner.coffee"]
  extensions: [".coffee", ".js"]
  destination: "dist-test"
  outputName: "runner.js"
}

server = { runSpec: -> }

srcDir = path.join(__dirname, "src")
testDir = path.join(__dirname, "test")

compileJs = ->
  browserify({
    entries: jsOptions.entries,
    extensions: jsOptions.extensions
  })
    .transform(coffeeify, {})
    .plugin(resolutions, ["formatio"])
    .bundle()
    .on("error", log)
    .pipe(source(jsOptions.outputName))
    .pipe(gulp.dest(jsOptions.destination))

matchingSpecFile = (filePath) ->
  ## only files in src/ having matching spec files
  return false if not _.includes(filePath, srcDir)

  specPath = filePath.replace(srcDir, path.join(__dirname, "test/integration"))
  specPath = specPath.replace(".coffee", "_spec.coffee")
  try
    fs.statSync(specPath)
    return specPath
  catch e
    return false

bundleJs = (options, watch = true) ->
  ret = {}

  bundler = browserify({
    entries: options.entries
    extensions: options.extensions
    cache: {}
    packageCache: {}
  })

  bundler
  .transform(coffeeify, {})
  .plugin(resolutions, ["formatio"])

  if watch
    bundler.plugin(watchify, {
      ignoreWatch: [
        "**/package.json"
        "**/.git/**"
        "**/.nyc_output/**"
        "**/.sass-cache/**"
        "**/coverage/**"
        "**/node_modules/**"
      ]
    })

  ret.promise = new Promise (resolve) ->
    outputName = $.util.colors.cyan(options.outputName)
    initial = true

    rebundle = (files = []) ->
      if initial
        $.util.log("Bundling #{outputName}")

      files.forEach (filePath) ->
        filePath = $.util.colors.yellow(path.basename(filePath))
        $.util.log("Bundling #{outputName} after #{filePath} changed")

      outputPath = path.join(__dirname, options.destination, options.outputName)

      bundler.bundle()
        .on("error", log)
        .pipe($.plumber(log))
        .on "end", ->
          $.util.log("Finished bundling #{outputName}")
          if initial
            initial = false
            resolve()
          else
            files.forEach (filePath) ->
              if specFile = matchingSpecFile(filePath)
                server.runSpec(specFile)
        .pipe(fs.createWriteStream(outputPath))

    bundler.on("update", rebundle)
    ret.process = rebundle()

  return ret

watchSpecs = ->
  gulp.watch "test/**/*_spec.coffee", (event) ->
    server.runSpec(event.path)

gulp.task "watch", ["ensure:dist:dir"], ->
  watchJs = bundleJs(jsOptions)
  # watchIndex = bundleJs(specIndexOptions)
  # watchRunner = bundleJs(specRunnerOptions)
  # watchSpecs()
  # Promise.all([watchJs.promise, watchIndex.promise, watchRunner.promise])
  # .then ->
    # server = require("#{__dirname}/test/support/server/server.coffee")
    # server.runSpecsContinuously()

  return watchJs.process

gulp.task "ensure:dist:dir", ->
  fs.ensureDirAsync(path.resolve("./dist-test"))

gulp.task "test", ["ensure:dist:dir"], ->
  buildSpecHelper = bundleJs(integrationSpecHelperOptions, false)
  buildIndex = bundleJs(specIndexOptions, false)
  buildRunner = bundleJs(specRunnerOptions, false)
  Promise.all([buildSpecHelper.promise, buildIndex.promise, buildRunner.promise])
  .then ->
    server = require("#{__dirname}/test/support/server/server.coffee")
    server.runAllSpecsOnce()

gulp.task "build", compileJs
