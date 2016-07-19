_             = require("underscore")
$             = require("gulp-load-plugins")()
os            = require("os")
fs            = require("fs")
gulp          = require("gulp")
path          = require("path")
yaml          = require("js-yaml")
Promise       = require("bluebird")
child_process = require("child_process")
runSequence   = require("run-sequence")
importOnce    = require("node-sass-import-once")
cyIcons       = require("@cypress/core-icons")
deploy        = require("./deploy")

fs = Promise.promisifyAll(fs)

rememberedNames = []

platform = ->
  {
    darwin: "osx64"
    linux:  "linux64"
  }[os.platform()] or throw new Error("OS Platform: '#{os.platform()}' not supported!")

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

compileCss = (source, dest) ->
  gulp.src("#{source}/css/**/*.scss")
    .pipe($.sass({
      importer: importOnce
      importOnce: {
        bower: true
        css: true
      }
    })
    .on('error', $.sass.logError))
    .pipe gulp.dest "#{dest}/public/css"

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

getAppJsOpts = ->
  destination: "lib/public/js"
  basePath: "app/js"

gulp.task "app:css", -> compileCss("app", "lib")

gulp.task "app:fonts", ->
  gulp.src("bower_components/font-awesome/fonts/**")
    .pipe gulp.dest "lib/public/css/fonts"

gulp.task "app:img", ["vendor:img", "project:img", "project:favicon", "project:logo"]

gulp.task "vendor:img", ->
  gulp.src("bower_components/jquery-ui/themes/smoothness/images/**")
    .pipe gulp.dest "lib/public/css/images"

gulp.task "project:img", ->
  gulp.src("app/img/**/*")
    .pipe gulp.dest "lib/public/img"

gulp.task "project:favicon", ->
  gulp.src(cyIcons.getPathToFavicon("**/*"))
    .pipe gulp.dest "lib/public/img"

gulp.task "project:logo", ->
  gulp.src cyIcons.getPathToIcon("icon_128x128@2x.png")
    .pipe gulp.dest "lib/public/img"

gulp.task "app:js", ->
  compileJs("app", getAppJsOpts())

gulp.task "bower", ->
  $.bower()

gulp.task "app:html", ->
  gulp.src(["app/html/*"])
    .pipe gulp.dest("lib/public")

gulp.task "app:watch", ["watch:app:css", "watch:app:js", "watch:app:html"]

gulp.task "watch:app:css", ->
  gulp.watch "app/css/**", ["app:css"]

gulp.task "watch:app:js", ->
  options = getAppJsOpts()

  getYaml("app").then (bundles) ->
    ## watch all of the files in the app.yml so we rebuild
    ## on any reloads including vendor changes
    files = _.chain(bundles).values().flatten().uniq().value()
    watcher = gulp.watch files, ["app:js"]

  #   _.each bundles, (files, name) ->
  #     watcher = gulp.watch files, ->
  #       start = process.hrtime()
  #       gulp.emit("task_start", {task: "app:js (#{name})"})
  #       transform(files, _.extend({concat: name}, options)).then ->
  #         end = process.hrtime(start)
  #         gulp.emit("task_stop", {task: "app:js (#{name})", hrDuration: end})

    ## nuke everything on delete or add
    watcher.on "change", (event) ->
      console.log event
      if /deleted|added/.test(event.type)
        _.each $.cached.caches, (value, key) ->
          delete $.cached.caches[key]

        _.each rememberedNames, (name) ->
          $.remember.forgetAll(name)

gulp.task "watch:app:html", ->
  gulp.watch "app/html/index.html", ["app:html"]

gulp.task "server", -> require("./server.coffee")

gulp.task "test", -> require("./spec/server.coffee")

gulp.task "release", deploy.release

gulp.task "deploy:fixture", ->
  require("./lib/deploy")().fixture()

gulp.task "build", deploy.build

gulp.task "deploy", deploy.deploy

gulp.task "app",        ["app:build", "app:watch"]

gulp.task "app:minify", ->
  ## dont minify cypress or sinon
  minify("lib/public/js/!(cypress|sinon).js", "lib/public/js")

gulp.task "app:build",  ["bower"], (cb) ->
  runSequence ["app:css", "app:img", "app:fonts", "app:js", "app:html"], cb
