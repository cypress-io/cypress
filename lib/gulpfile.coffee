gulp      = require 'gulp'
$         = require('gulp-load-plugins')()
path      = require 'path'
_         = require 'underscore'
fs        = require 'fs'
yaml      = require 'js-yaml'
jQuery    = require 'jquery-deferred'

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
  $.util.log _(args).compact()...
  $.util.beep()

transform = (paths, options = {}) ->
  df = jQuery.Deferred()

  gulp.src(paths)
    .pipe $.plumber errorHandler: log

    .pipe $.tap (file, t) ->
      t.through($.coffee, []) if isCoffee(file)

    .pipe $.tap (file, t) ->
      t.through($.eco, [basePath: options.basePath])  if isEco(file)

    .pipe if options.concat then $.concat(options.concat + ".js", newLine: "; \r\n") else $.util.noop()

    .pipe gulp.dest(options.destination)

    .on "end", df.resolve

  return df

isCoffee  = (file) -> file.isBuffer() and /.coffee$/.test(file.path)
isEco     = (file) -> file.isBuffer() and /.eco$/.test(file.path)

compileCss = (source, dest) ->
  gulp.src("#{source}/css/**/*.scss")
    .pipe $.rubySass
      trace: true
      compass: true
      cacheLocation: ".tmp/.sass-cache"
    .on "error", log
    .pipe gulp.dest "#{dest}/public/css"

compileJs = (source, options, cb) ->
  bundles = yaml.load(fs.readFileSync("#{source}/js/js.yml", "utf8"))

  tasks = _.reduce bundles, (memo, files, name) ->
    obj = _.extend {}, options, {concat: name}
    memo.push transform(files, obj)
    memo
  , []

  jQuery.when(tasks...).done cb

gulp.task "app:css", -> compileCss("app", "lib")

gulp.task "nw:css", -> compileCss("nw", "nw")

gulp.task "fonts", ->
  gulp.src("bower_components/font-awesome/fonts/**")
    .pipe gulp.dest "lib/public/css/fonts"
    .pipe gulp.dest "nw/public/css/fonts"

gulp.task "app:img", ["vendor:img", "project:img"]

gulp.task "vendor:img", ->
  gulp.src("bower_components/jquery-ui/themes/smoothness/images/**")
    .pipe gulp.dest "lib/public/css/images"

gulp.task "project:img", ->
  gulp.src("app/img/**/*")
    .pipe gulp.dest "lib/public/img"

gulp.task "app:js", (cb) ->
  options =
    destination: "./lib/public/js"
    basePath: "app/js"

  compileJs("app", options, cb)
  return false

gulp.task "nw:js", (cb) ->
  options =
    destination: "nw/public/js"
    basePath: "nw/js"

  compileJs("nw", options, cb)
  return false

gulp.task "bower", ->
  $.bower()

gulp.task "app:html", ->
  gulp.src(["app/html/index.html", "app/html/id_generator.html"])
    .pipe gulp.dest("lib/public")

gulp.task "nw:html", ->
  gulp.src("nw/html/*")
    .pipe gulp.dest("nw/public")

gulp.task "app:watch", ["watch:app:css", "watch:app:js", "watch:app:html"]
gulp.task "nw:watch",  ["watch:nw:css",  "watch:nw:js",  "watch:nw:html"]

gulp.task "watch:app:css", ->
  gulp.watch "app/css/**", ["app:css"]

gulp.task "watch:app:js", ->
  gulp.watch "app/js/**/*", ["app:js"]

gulp.task "watch:nw:css", ->
  gulp.watch "nw/css/**", ["nw:css"]

gulp.task "watch:nw:js", ->
  gulp.watch "nw/js/**/*", ["nw:js"]

gulp.task "watch:app:html", ->
  gulp.watch "app/html/index.html", ["app:html"]

gulp.task "watch:nw:html", ->
  gulp.watch "nw/html/**", ["nw:html"]

gulp.task "server", -> require("./server.coffee")

gulp.task "test", -> require("../spec/server.coffee")

gulp.task "default", ["bower", "app:css", "app:img", "fonts", "app:js", "app:html", "app:watch"]
gulp.task "compile", ["bower", "app:css", "app:img", "fonts", "app:js", "app:html"]
gulp.task "nw",      ["bower", "nw:css",             "fonts", "nw:js",  "nw:html",  "nw:watch"]
