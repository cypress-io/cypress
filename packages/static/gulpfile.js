const gulp = require('gulp')
const icons = require('@cypress/icons')

gulp.task('favicon', () => {
  return gulp.src(icons.getPathToFavicon('**/**'))
  .pipe(gulp.dest('./dist'))
})

gulp.task('build', gulp.parallel('favicon'))
