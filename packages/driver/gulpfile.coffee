fs            = require("fs")
_             = require("lodash")
$             = require("gulp-load-plugins")()
gulp          = require("gulp")
path          = require("path")
Promise       = require("bluebird")
runSequence   = require("run-sequence")
importOnce    = require("node-sass-import-once")
cyIcons       = require("@cypress/icons")
browserify    = require("browserify")
coffeeify     = require("coffeeify")
watchify      = require("watchify")
source        = require("vinyl-source-stream")

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

specHelperOptions = {
  entries: ["test/support/spec_helper.coffee"]
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

matchingSpecFile = (filePath) ->
  specPath = filePath.replace(path.join(__dirname, "src"), path.join(__dirname, "test/unit"))
  specPath = specPath.replace(".coffee", "_spec.coffee")
  try
    fs.statSync(specPath)
    return specPath
  catch e
    return false

compileJs = ->
  browserify({
    entries: jsOptions.entries,
    extensions: jsOptions.extensions
  })
    .transform(coffeeify, {})
    .bundle()
    .on("error", log)
    .pipe(source(jsOptions.outputName))
    .pipe(gulp.dest(jsOptions.destination))

bundleJs = (options, watch = true) ->
  ret = {}

  bundler = browserify({
    entries: options.entries
    extensions: options.extensions
    cache: {}
    packageCache: {}
  })

  bundler.transform(coffeeify, {})
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

# gulp.task "app:img", ["vendor:img", "project:img", "project:favicon", "project:logo"]

# gulp.task "vendor:img", ->
#   gulp.src("node_modules/jquery-ui/themes/smoothness/images/**")
#     .pipe gulp.dest "lib/public/css/images"
#
# gulp.task "project:img", ->
#   gulp.src("app/img/**/*")
#     .pipe gulp.dest "lib/public/img"
#
# gulp.task "project:favicon", ->
#   gulp.src(cyIcons.getPathToFavicon("**/*"))
#     .pipe gulp.dest "lib/public/img"
#
# gulp.task "project:logo", ->
#   gulp.src cyIcons.getPathToIcon("icon_128x128@2x.png")
#     .pipe gulp.dest "lib/public/img"

gulp.task "app:js", ->
  compileJs()

gulp.task "app:html", ->
  gulp.src(["app/html/*"])
    .pipe gulp.dest("lib/public")

gulp.task "watch", ["watch:app:js", "watch:app:html"]

gulp.task "watch:app:js", -> bundleJs(jsOptions)

gulp.task "watch:app:html", ->
  gulp.watch "app/html/index.html", ["app:html"]

gulp.task "server", -> require("./server/server.coffee")

gulp.task "test", ->
  watchSpecHelper = bundleJs(specHelperOptions)
  watchIndex = bundleJs(specIndexOptions)
  watchRunner = bundleJs(specRunnerOptions)
  watchSpecs()
  Promise.all([watchSpecHelper.promise, watchIndex.promise, watchRunner.promise])
  .then ->
    server = require("#{__dirname}/test/support/server/server.coffee")
    server.runSpecsContinuously()

  return watchSpecHelper.process

gulp.task "test:once", ->
  buildSpecHelper = bundleJs(specHelperOptions, false)
  buildIndex = bundleJs(specIndexOptions, false)
  buildRunner = bundleJs(specRunnerOptions, false)
  Promise.all([buildSpecHelper.promise, buildIndex.promise, buildRunner.promise])
  .then ->
    server = require("#{__dirname}/test/support/server/server.coffee")
    server.runAllSpecsOnce()

gulp.task "app", ["app:html", "app:watch"]

gulp.task "build", (cb) ->
  runSequence ["app:js", "app:html"], cb
