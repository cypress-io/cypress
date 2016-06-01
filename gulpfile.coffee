_             = require("lodash")
$             = require("gulp-load-plugins")()
fs            = require("fs")
gulp          = require("gulp")
path          = require("path")
yaml          = require("js-yaml")
Promise       = require("bluebird")
child_process = require("child_process")
runSequence   = require("run-sequence")
importOnce    = require("node-sass-import-once")
cyIcons       = require("@cypress/core-icons")

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
      .pipe $.replace("//# sourceMappingURL=sidecar.js.map;", "")

      .pipe gulp.dest(options.destination)

      .on "error", reject

      .on "end", resolve

isCoffee  = (file) -> file.isBuffer() and /.coffee$/.test(file.path)
isEco     = (file) -> file.isBuffer() and /.eco$/.test(file.path)

getYaml = ->
  fs.readFileAsync("app/js/js.yml", "utf8").then(yaml.load)

compileJs = (options) ->
  getYaml().then (bundles) ->
    tasks = _.reduce bundles, (memo, files, name) ->
      obj = _.extend {}, options, {concat: name}
      memo.push transform(files, obj)
      memo
    , []

    Promise.all(tasks)

getAppJsOpts = ->
  destination: "dist/js"
  basePath: "app/js"

gulp.task "css", ->
  gulp.src("app/css/**/*.scss")
    .pipe($.sass({
      importer: importOnce
      importOnce: {
        bower: true
        css: true
      }
    })
    .on('error', $.sass.logError))
    .pipe gulp.dest "dist/css"

gulp.task "fonts", ->
  gulp.src("bower_components/font-awesome/fonts/**")
    .pipe gulp.dest "dist/css/fonts"

gulp.task "img", ["vendor:img", "project:img", "project:favicon", "project:logo"]

gulp.task "vendor:img", ->
  gulp.src("bower_components/jquery-ui/themes/smoothness/images/**")
    .pipe gulp.dest "dist/css/images"

gulp.task "project:img", ->
  gulp.src("app/img/**/*")
    .pipe gulp.dest "dist/img"

gulp.task "project:favicon", ->
  gulp.src(cyIcons.getPathToFavicon("**/*"))
    .pipe gulp.dest "dist/img"

gulp.task "project:logo", ->
  gulp.src cyIcons.getPathToIcon("icon_128x128@2x.png")
    .pipe gulp.dest "dist/img"

gulp.task "js", ->
  compileJs(getAppJsOpts())

gulp.task "bower", ->
  $.bower()

gulp.task "clean", ->
  gulp.src("dist")
  .pipe($.clean())

gulp.task "html", ->
  gulp.src(["app/html/*"])
    .pipe gulp.dest("dist/public")

gulp.task "watch", ["watch:css", "watch:js", "watch:html"]

gulp.task "watch:css", ->
  gulp.watch "app/css/**", ["css"]

gulp.task "watch:js", ->
  options = getAppJsOpts()

  getYaml().then (bundles) ->
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

gulp.task "watch:html", ->
  gulp.watch "app/html/index.html", ["html"]

gulp.task "dev", ["build", "watch"]

gulp.task "minify", ->
  ## dont minify cypress or sinon
  gulp.src("dist/js/!(cypress|sinon).js")
    .pipe($.print())
    .pipe($.uglify({
      preserveComments: "some"
    }))
    .pipe(gulp.dest("dist/js"))

gulp.task "build", (cb) ->
  runSequence "clean", "bower", ["css", "img", "fonts", "js", "html"], cb
