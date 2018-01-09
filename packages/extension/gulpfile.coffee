Promise = require("bluebird")
fs = Promise.promisifyAll(require("fs-extra"))
gulp = require("gulp")
rename = require("gulp-rename")
source = require("vinyl-source-stream")
Promise = require("bluebird")
coffeeify = require("coffeeify")
browserify = require("browserify")
icons = require("@cypress/icons")
webExt = require("web-ext").default
path = require("path")
streamToPromise = require("stream-to-promise")
del = require("del")
execa = require("execa")

ext = require("./")
pkg = require("./package.json")

copySocketClient = ->
  gulp.src(require("../socket").getPathToClientSource())
  .pipe(gulp.dest("dist"))

cleanDist = ->
  del("dist", "dist-firefox")

manifest = ->
  streamToPromise(
    gulp.src("app/manifest.json")
    .pipe(gulp.dest("dist"))
  )
  .then ->
    fs.readJsonAsync("dist/manifest.json")
  .then (json) ->
    json.version = pkg.version
    fs.writeJsonAsync("dist/manifest.json", json, {spaces: 2})

backup = ->
  gulp.src("dist/background.js")
  .pipe(rename("background_src.js"))
  .pipe(gulp.dest("dist"))

background = ->
  browserify({
    entries: "app/background.coffee"
    transform: coffeeify
  })
  .bundle()
  .pipe(source("background.js"))
  .pipe(gulp.dest("dist"))

js = ->
  gulp.src("app/**/*.js")
  .pipe(gulp.dest("dist"))

html = ->
  gulp.src("app/**/*.html")
  .pipe(gulp.dest("dist"))

css = ->
  gulp.src("app/**/*.css")
  .pipe(gulp.dest("dist"))

copyIcons = ->
  gulp.src([
    icons.getPathToIcon("icon_16x16.png")
    icons.getPathToIcon("icon_19x19.png")
    icons.getPathToIcon("icon_38x38.png")
    icons.getPathToIcon("icon_48x48.png")
    icons.getPathToIcon("icon_128x128.png")
  ])
  .pipe(gulp.dest("dist/icons"))

logos = ->
  gulp.src([
    icons.getPathToLogo("cypress-bw.png")
  ])
  .pipe(gulp.dest("dist/logos"))

# firefox = ->
#   src = path.resolve("./dist")
#   dest = path.resolve("./dist-firefox")
#
#   fs.ensureDirAsync(dest)
#   .then ->
#     webExt.cmd.build({
#       sourceDir: src
#       artifactsDir: dest
#     })

build = gulp.series(
  cleanDist,
  gulp.parallel(
    copySocketClient,
    copyIcons,
    logos,
    manifest,
    background,
    js,
    html,
    css
  )
)

watch = gulp.series build, ->
  gulp.watch("app/**/*", build)


gulp.task("build", build)
gulp.task("watch", watch)
