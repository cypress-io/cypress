const gulp = require('gulp')
const icons = require('@cypress/icons')

gulp.task('build', gulp.parallel('favicon', () => {
  return gulp.src(icons.getPathToFavicon('**/**'))
  .pipe(gulp.dest('./dist'))
}))
