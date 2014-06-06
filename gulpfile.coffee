gulp    = require('gulp')
$       = require('gulp-load-plugins')()

gulp.task "default", ->
  require("./server.coffee")