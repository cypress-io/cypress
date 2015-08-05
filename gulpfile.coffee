gulp          = require 'gulp'
$             = require('gulp-load-plugins')()
path          = require 'path'
_             = require 'underscore'
fs            = require 'fs'
yaml          = require 'js-yaml'
Promise       = require "bluebird"
child_process = require "child_process"
runSequence   = require "run-sequence"
os            = require "os"
deploy        = require "./lib/deploy"

require("lodash").bindAll(deploy)

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
  new Promise (resolve, reject) ->
    gulp.src(paths)
      .pipe $.plumber errorHandler: log

      .pipe $.tap (file, t) ->
        t.through($.coffee, []) if isCoffee(file)

      .pipe $.tap (file, t) ->
        t.through($.eco, [basePath: options.basePath])  if isEco(file)

      .pipe if options.concat then $.concat(options.concat + ".js", newLine: "; \r\n") else $.util.noop()

      .pipe gulp.dest(options.destination)

      .on "error", reject

      .on "end", resolve

isCoffee  = (file) -> file.isBuffer() and /.coffee$/.test(file.path)
isEco     = (file) -> file.isBuffer() and /.eco$/.test(file.path)

compileCss = (source, dest) ->
  gulp.src("#{source}/css/**/*.scss")
    .pipe $.rubySass
      trace: true
      compass: true
      cacheLocation: ".tmp/.sass-cache"
      sourcemap: false
    .on "error", log
    .pipe gulp.dest "#{dest}/public/css"

compileJs = (source, options, cb) ->
  bundles = yaml.load(fs.readFileSync("#{source}/js/js.yml", "utf8"))

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

gulp.task "client:css", -> compileCss("app", "lib")

gulp.task "nw:css", -> compileCss("nw", "nw")

gulp.task "client:fonts", ->
  gulp.src("bower_components/font-awesome/fonts/**")
    .pipe gulp.dest "lib/public/css/fonts"
    .pipe gulp.dest "nw/public/css/fonts"

gulp.task "client:img", ["vendor:img", "project:img"]

gulp.task "nw:img", ["nw:icns", "nw:tray", "nw:logo"]

gulp.task "nw:logo", ->
  gulp.src("nw/img/cypress.iconset/icon_32x32@2x.png")
    .pipe gulp.dest "nw/public/img/cypress.iconset"

gulp.task "nw:tray", ->
  gulp.src("nw/img/tray/**/*")
    .pipe gulp.dest "nw/public/img/tray"

gulp.task "nw:icns", ->
  p = new Promise (resolve, reject) ->
    ## bail if we arent on a mac else `iconutil` will fail
    return resolve() if os.platform() isnt "darwin"

    child_process.exec "iconutil -c icns nw/img/cypress.iconset", (err, stdout, stderr) ->
      return reject(err) if err

      resolve()
  p.then ->
    gulp.src("nw/img/cypress.icns")
      .pipe gulp.dest "nw/public/img"

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

gulp.task "nw:js", (cb) ->
  options =
    destination: "nw/public/js"
    basePath: "nw/js"

  compileJs("nw", options, cb)

gulp.task "bower", ->
  $.bower()

gulp.task "build:secret:sauce", (cb) ->
  ## convert to js from coffee (with bare: true)
  gulp.src("lib/secret_sauce.coffee")
    .pipe($.coffee({bare: true}))
    .pipe gulp.dest("lib")
    .on "end", ->
      ## when thats done, lets create the secret_sauce snapshot .bin
      child_process.exec "./support/#{platform()}/nwjc lib/secret_sauce.js lib/secret_sauce.bin", (err, stdout, stderr) ->
        console.log("stdout:", stdout)
        console.log("stderr:", stderr)

        if err
          console.log("err with nwjc:", err)

        ## finally cleanup any v8 logs and remove secret sauce.js
        gulp.src(["lib/secret_sauce.js", "./v8.log"])
          .on "end", cb
          .pipe($.clean())

  return false

gulp.task "client:html", ->
  gulp.src(["app/html/index.html", "app/html/id_generator.html"])
    .pipe gulp.dest("lib/public")

gulp.task "nw:html", ->
  gulp.src("nw/html/*")
    .pipe gulp.dest("nw/public")

gulp.task "client:watch", ["watch:client:css", "watch:client:js", "watch:client:html"]
gulp.task "nw:watch",  ["watch:nw:css",  "watch:nw:js",  "watch:nw:html", "watch:nw:secret:sauce"]

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

gulp.task "watch:nw:secret:sauce", ->
  gulp.watch "lib/secret_sauce.coffee", ["nw:snapshot"]

gulp.task "server", -> require("./server.coffee")

gulp.task "test", -> require("./spec/server.coffee")

gulp.task "dist:tests", deploy.runTests

gulp.task "build:smoke:test", deploy.runSmokeTest

gulp.task "after:build", deploy.afterBuild

gulp.task "dist", deploy.dist

gulp.task "build", deploy.build

gulp.task "release", deploy.release

gulp.task "deploy:fixture", ->
  require("./lib/deploy")().fixture()

gulp.task "deploy:manifest", deploy.manifest

gulp.task "get:manifest", deploy.getManifest

gulp.task "deploy", deploy.deploy

gulp.task "client",        ["client:build", "client:watch"]
gulp.task "nw",            ["nw:build", "nw:watch"]

gulp.task "client:minify", ->
  minify("lib/public/js/!(cypress).js", "lib/public/js")

gulp.task "nw:minify", ->
  minify("nw/public/js/*.js", "nw/public/js")

gulp.task "client:build",  ["bower"], (cb) ->
  runSequence ["client:css", "client:img", "client:fonts", "client:js", "client:html"], cb

gulp.task "nw:build",      ["bower"], (cb) ->
  runSequence ["nw:css", "nw:img", "client:fonts", "nw:js", "nw:html", "nw:snapshot"], cb

gulp.task "nw:snapshot",   ["build:secret:sauce"]