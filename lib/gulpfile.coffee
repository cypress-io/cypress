gulp      = require('gulp')
$         = require('gulp-load-plugins')()
path      = require("path")
_         = require("underscore")
fs        = require("fs")
yaml      = require("js-yaml")
jQuery    = require("jquery-deferred")

transform = (paths, options = {}) ->
  _.defaults options,
    destination: "./build/js"

  df = jQuery.Deferred()

  gulp.src(paths)
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
    .pipe gulp.dest "build/css"

gulp.task "fonts", ->
  gulp.src("bower_components/font-awesome/fonts/**")
    .pipe gulp.dest "build/css/fonts"

gulp.task "js", (cb) ->
  bundles = yaml.load(fs.readFileSync("./lib/js.yml", "utf8"))

  tasks = _.reduce bundles, (memo, files, name) ->
    memo.push transform(files, {concat: name})
    memo
  , []

  jQuery.when(tasks...).done cb

  return false

gulp.task "html", ->
  gulp.src("app/html/index.html")
    .pipe gulp.dest("build")

gulp.task "watch", ["watch:css", "watch:js", "watch:html"]

gulp.task "watch:css", ->
  gulp.watch "app/css/**", ["css"]

gulp.task "watch:js", ->
  gulp.watch "app/js/**/*", ["js"]

gulp.task "watch:html", ->
  gulp.watch "app/html/index.html", ["html"]

gulp.task "server", ->
  require("./server.coffee")

gulp.task "default", ["server", "css", "fonts", "js", "html", "watch"]