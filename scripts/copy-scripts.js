var gulp = require("gulp")
var concat = require('gulp-concat')

module.exports = function copyScripts (dir) {
  return function () {
    return gulp.src([
      "node_modules/jquery/dist/jquery.js",
      "node_modules/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js",
      "node_modules/bootstrap-sass/assets/javascripts/bootstrap/alert.js",
    ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(dir))
  }
}