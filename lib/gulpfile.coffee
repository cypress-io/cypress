gulp      = require('gulp')
$         = require('gulp-load-plugins')()
path      = require("path")
_         = require("underscore")
fs        = require("fs")
yaml      = require("js-yaml")
jQuery    = require("jquery-deferred")

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
  _.defaults options,
    destination: "./lib/public/js"

  df = jQuery.Deferred()

  gulp.src(paths)
    .pipe $.plumber errorHandler: log

    .pipe $.tap (file, t) ->
      t.through($.coffee, []) if isCoffee(file)

    .pipe $.tap (file, t) ->
      t.through($.eco, [basePath: "app/js"])  if isEco(file)

    .pipe if options.concat then $.concat(options.concat + ".js", newLine: "; \r\n") else $.util.noop()

    .pipe gulp.dest(options.destination)

    .on "end", df.resolve

  return df

isCoffee  = (file) -> file.isBuffer() and /.coffee$/.test(file.path)
isEco     = (file) -> file.isBuffer() and /.eco$/.test(file.path)

gulp.task "css", ->
  gulp.src("app/css/**/*.scss")
    .pipe $.rubySass
      trace: true
      compass: true
      cacheLocation: ".tmp/.sass-cache"
    .on "error", log
    .pipe gulp.dest "lib/public/css"

gulp.task "fonts", ->
  gulp.src("bower_components/font-awesome/fonts/**")
    .pipe gulp.dest "lib/public/css/fonts"

gulp.task "img", ["vendor:img", "project:img"]

gulp.task "vendor:img", ->
  gulp.src("bower_components/jquery-ui/themes/smoothness/images/**")
    .pipe gulp.dest "lib/public/css/images"

gulp.task "project:img", ->
  gulp.src("app/img/**/*")
    .pipe gulp.dest "lib/public/img"

gulp.task "js", (cb) ->
  bundles = yaml.load(fs.readFileSync("./lib/js.yml", "utf8"))

  tasks = _.reduce bundles, (memo, files, name) ->
    memo.push transform(files, {concat: name})
    memo
  , []

  jQuery.when(tasks...).done cb

  return false

gulp.task "bower", ->
  $.bower()

gulp.task "html", ->
  gulp.src(["app/html/index.html", "app/html/id_generator.html"])
    .pipe gulp.dest("lib/public")

gulp.task "watch", ["watch:css", "watch:js", "watch:html"]

gulp.task "watch:css", ->
  gulp.watch "app/css/**", ["css"]

gulp.task "watch:js", ->
  gulp.watch "app/js/**/*", ["js"]

gulp.task "watch:html", ->
  gulp.watch "app/html/index.html", ["html"]

gulp.task "server", ->
  require("./server.coffee")

gulp.task "test", ->
  require("../spec/server.coffee")

gulp.task "default", ["bower", "css", "img", "fonts", "js", "html", "watch"]