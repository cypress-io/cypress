fs      = require("fs-extra")
pkg     = require("./package.json")
gulp    = require("gulp")
clean   = require("gulp-clean")
coffee  = require("gulp-coffee")
rename  = require("gulp-rename")
runSeq  = require("run-sequence")
socket  = require("@cypress/core-socket")
icons   = require("@cypress/core-icons")
Promise = require("bluebird")
ext     = require("./")

gulp.task "copy:socket:client", ->
  gulp.src(socket.getPathToClientSource())
  .pipe(gulp.dest("dist"))

gulp.task "clean", ->
  gulp.src("dist")
  .pipe(clean())

gulp.task "manifest", (done) ->
  gulp.src("app/manifest.json")
  .pipe(gulp.dest("dist"))
  .on "end", ->
    fs.readJson "dist/manifest.json", (err, json) ->
      json.version = pkg.version
      fs.writeJson "dist/manifest.json", json, {spaces: 2}, done
  null

gulp.task "backup", ->
  gulp.src("dist/background.js")
  .pipe(rename("background_src.js"))
  .pipe(gulp.dest("dist"))

gulp.task "default:host:path", ->
  ext.setHostAndPath("http://localhost:2020", "/__socket.io")

gulp.task "coffeescript", ->
  gulp.src("app/**/*.coffee")
  .pipe(coffee())
  .pipe(gulp.dest("dist"))

gulp.task "html", ->
  gulp.src("app/**/*.html")
  .pipe(gulp.dest("dist"))

gulp.task "css", ->
  gulp.src("app/**/*.css")
  .pipe(gulp.dest("dist"))

gulp.task "icons", ->
  gulp.src([
    icons.getPathToIcon("icon_16x16.png")
    icons.getPathToIcon("icon_19x19.png")
    icons.getPathToIcon("icon_38x38.png")
    icons.getPathToIcon("icon_48x48.png")
    icons.getPathToIcon("icon_128x128.png")
  ])
  .pipe(gulp.dest("dist/icons"))

gulp.task "logos", ->
  gulp.src([
    icons.getPathToLogo("cypress-bw.png")
  ])
  .pipe(gulp.dest("dist/logos"))

gulp.task "watch", ["build"], ->
  gulp.watch("app/**/*", ["build"])

gulp.task "build", ->
  runSeq "clean", ["copy:socket:client", "icons", "logos", "manifest", "coffeescript", "html", "css"], "backup", "default:host:path"
