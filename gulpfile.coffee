gulp    = require('gulp')
$       = require('gulp-load-plugins')()

gulp.task "css", ->
  gulp.src("app/css/**/*.scss")
    .pipe $.rubySass
      trace: true
      compass: true
      cacheLocation: ".tmp/.sass-cache"
    .pipe gulp.dest "build/css"

gulp.task "default", ["server", "css"], ->
  require("./server.coffee")