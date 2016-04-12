fs     = require("fs-extra")
pkg    = require("./package.json")
gulp   = require("gulp")
clean  = require("gulp-clean")
coffee = require("gulp-coffee")
runSeq = require("run-sequence")
socket = require("@cypress/core-socket")
icons  = require("@cypress/core-icons")

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

gulp.task "coffeescript", ->
  gulp.src("app/**/*.coffee")
  .pipe(coffee())
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

gulp.task "watch", ["build"], ->
  gulp.watch("app/**/*", ["build"])

gulp.task "build", ->
  runSeq "clean", ["copy:socket:client", "icons", "manifest", "coffeescript"]