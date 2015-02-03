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

gulp.task "client:css", -> compileCss("app", "lib")

gulp.task "nw:css", -> compileCss("nw", "nw")

gulp.task "client:fonts", ->
  gulp.src("bower_components/font-awesome/fonts/**")
    .pipe gulp.dest "lib/public/css/fonts"
    .pipe gulp.dest "nw/public/css/fonts"

gulp.task "client:img", ["vendor:img", "project:img"]

gulp.task "vendor:img", ->
  gulp.src("bower_components/jquery-ui/themes/smoothness/images/**")
    .pipe gulp.dest "lib/public/css/images"

gulp.task "project:img", ->
  gulp.src("app/img/**/*")
    .pipe gulp.dest "lib/public/img"

gulp.task "client:js", (cb) ->
  options =
    destination: "lib/public/js"
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

gulp.task "client:html", ->
  gulp.src(["app/html/index.html", "app/html/id_generator.html"])
    .pipe gulp.dest("lib/public")

gulp.task "nw:html", ->
  gulp.src("nw/html/*")
    .pipe gulp.dest("nw/public")

gulp.task "client:watch", ["watch:client:css", "watch:client:js", "watch:client:html"]
gulp.task "nw:watch",  ["watch:nw:css",  "watch:nw:js",  "watch:nw:html"]

gulp.task "watch:client:css", ->
  gulp.watch "app/css/**", ["client:css"]

gulp.task "watch:client:js", ->
  gulp.watch "app/js/**/*", ["client:js"]

gulp.task "watch:nw:css", ->
  gulp.watch "nw/css/**", ["nw:css"]

gulp.task "watch:nw:js", ->
  gulp.watch "nw/js/**/*", ["nw:js"]

gulp.task "watch:client:html", ->
  gulp.watch "app/html/index.html", ["client:html"]

gulp.task "watch:nw:html", ->
  gulp.watch "nw/html/**", ["nw:html"]

gulp.task "server", -> require("./server.coffee")

gulp.task "test", -> require("../spec/server.coffee")

gulp.task "deploy", ["client:build", "nw:build"], ->
  require("./lib/deploy")()

gulp.task "client",        ["client:build", "client:watch"]
gulp.task "nw",            ["nw:build", "nw:watch"]

gulp.task "client:build",  ["bower", "client:css", "client:img", "client:fonts", "client:js", "client:html"]
gulp.task "nw:build",      ["bower", "nw:css", "client:fonts", "nw:js", "nw:html"]