gulp          = require("gulp")
$             = require("gulp-load-plugins")()
path          = require("path")
_             = require("lodash")
fs            = require("fs")
yaml          = require("js-yaml")
Promise       = require("bluebird")
child_process = require("child_process")
runSequence   = require("run-sequence")
importOnce    = require("node-sass-import-once")

fs = Promise.promisifyAll(fs)

rememberedNames = []

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

  cacheName = path.join(options.destination, options.concat)

  if cacheName not in rememberedNames
    rememberedNames.push(cacheName)

  new Promise (resolve, reject) ->
    gulp.src(paths)
      .pipe $.cached(cacheName)

      .pipe $.plumber errorHandler: log

      .pipe $.tap (file, t) ->
        t.through($.coffee, []) if isCoffee(file)

      .pipe $.tap (file, t) ->
        t.through($.eco, [basePath: options.basePath])  if isEco(file)

      .pipe $.remember(cacheName)

      .pipe if options.concat then $.concat(options.concat + ".js", newLine: "; \r\n") else $.util.noop()

      .pipe gulp.dest(options.destination)

      .on "error", reject

      .on "end", resolve

isCoffee  = (file) -> file.isBuffer() and /.coffee$/.test(file.path)
isEco     = (file) -> file.isBuffer() and /.eco$/.test(file.path)

getYaml = (source) ->
  fs.readFileAsync("#{source}/js/js.yml", "utf8").then(yaml.load)

compileJs = (source, options) ->
  getYaml(source).then (bundles) ->
    tasks = _.reduce bundles, (memo, files, name) ->
      obj = _.extend {}, options, {concat: name}
      memo.push transform(files, obj)
      memo
    , []

    Promise.all(tasks)

minify = (source, destination) ->
  gulp.src(source)
    .pipe($.print())
    .pipe($.uglify({
      preserveComments: "some"
    }))
    .pipe(gulp.dest(destination))

getClientJsOpts = ->
  destination: "dist/js"
  basePath: "app/js"

gulp.task "css", ->
  gulp.src("app/css/**/*.scss")
    .pipe($.sass({
      importer: importOnce
      importOnce: {
        bower: true
      }
    })
    .on('error', $.sass.logError))
    .pipe gulp.dest "dist/css"

gulp.task "fonts", ->
  gulp.src("bower_components/font-awesome/fonts/**")
    .pipe gulp.dest "dist/css/fonts"

gulp.task "vendor:img", ->
  gulp.src("bower_components/jquery-ui/themes/smoothness/images/**")
    .pipe gulp.dest "dist/css/images"

gulp.task "img", ->
  gulp.src("app/img/**/*")
    .pipe gulp.dest "dist/img"

gulp.task "js", ->
  compileJs("app", getClientJsOpts())

gulp.task "bower", ->
  $.bower()

gulp.task "html", ->
  gulp.src(["app/html/*"])
    .pipe gulp.dest("dist")

gulp.task "watch", ["watch:css", "watch:js", "watch:html"]

gulp.task "watch:html", ->
  gulp.watch "app/html/**", ["html"]

gulp.task "watch:css", ->
  gulp.watch "app/css/**", ["css"]

gulp.task "watch:js", ->
  options = getClientJsOpts()

  getYaml("app").then (bundles) ->
    ## watch all of the files in the app.yml so we rebuild
    ## on any reloads including vendor changes
    files = _.chain(bundles).values().flatten().uniq().value()
    watcher = gulp.watch files, ["js"]

    ## nuke everything on delete or add
    watcher.on "change", (event) ->
      console.log event
      if /deleted|added/.test(event.type)
        _.each $.cached.caches, (value, key) ->
          delete $.cached.caches[key]

        _.each rememberedNames, (name) ->
          $.remember.forgetAll(name)

gulp.task "dev",        ["build", "watch"]

gulp.task "minify", ->
  ## dont minify cypress or sinon
  minify("dist/js/!(cypress|sinon).js", "dist/js")

gulp.task "build",  ["bower"], (cb) ->
  runSequence ["css", "img", "fonts", "js", "html"], cb
