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

jsOptions =
  entries: ["src/main.coffee"]
  extensions: [".coffee", ".js"]
  destination: "dist"
  outputName: "driver.js"

specOptions =
  entries: ["test/support/spec_helper.coffee"]
  extensions: [".coffee", ".js"]
  destination: "dist-test"
  outputName: "spec_helper.js"

compileJs = ->
  browserify({
    entries: jsOptions.entries,
    extensions: jsOptions.extensions
  })
    .transform(coffeeify, {})
    .bundle()
    .on('error', log)
    .pipe(source(jsOptions.outputName))
    .pipe(gulp.dest(jsOptions.destination))

watchJs = (options) ->
  bundler = browserify({
    entries: options.entries
    extensions: options.extensions
    cache: {}
    packageCache: {}
  })

  bundler.transform(coffeeify, {})
  bundler.plugin(watchify, {
    ignoreWatch: [
      "**/.git/**"
      "**/.nyc_output/**"
      "**/.sass-cache/**"
      "**/coverage/**"
      "**/node_modules/**"
    ]
  })

  rebundle = (files = []) ->
    files.forEach (filePath) ->
      filePath = $.util.colors.yellow(path.basename(filePath))
      outputName = $.util.colors.cyan(options.outputName)
      $.util.log("Bundling #{outputName} after #{filePath} changed")

    outputPath = path.join(__dirname, options.destination, options.outputName)

    bundler.bundle()
      .on('error', log)
      .pipe($.plumber(log))
      .on 'end', ->
        $.util.log("Finished bundling #{$.util.colors.cyan(options.outputName)}")
      .pipe(fs.createWriteStream(outputPath))

  bundler.on 'update', (files) =>
    rebundle(files)

  return rebundle()

# gulp.task "app:img", ["vendor:img", "project:img", "project:favicon", "project:logo"]

# gulp.task "vendor:img", ->
#   gulp.src("bower_components/jquery-ui/themes/smoothness/images/**")
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

gulp.task "watch:app:js", -> watchJs(jsOptions)

gulp.task "watch:app:html", ->
  gulp.watch "app/html/index.html", ["app:html"]

gulp.task "server", -> require("./server.coffee")

gulp.task "test", ->
  watchJs(specOptions)
  require("./test/support/server.coffee")

gulp.task "app", ["app:html", "app:watch"]

gulp.task "build", (cb) ->
  runSequence ["app:js", "app:html"], cb
