gulp    = require('gulp')
$       = require('gulp-load-plugins')()

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

gulp.task "watch", ->
  gulp.watch "app/css/**", ["css"]

gulp.task "server", ->
  require("./server.coffee")

gulp.task "default", ["server", "css", "fonts", "watch"]