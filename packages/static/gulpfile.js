const gulp = require('gulp')
const icons = require('@cypress/icons')

exports.build = () => {
  return gulp.src(icons.getPathToFavicon('**/**'))
  .pipe(gulp.dest('./dist'))
}
