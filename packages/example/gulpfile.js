let gulp = require('gulp')
let ghPages = require('gulp-gh-pages')
let clean = require('gulp-clean')
let RevAll = require('gulp-rev-all')

gulp.task('assets', function () {
  let revAllOpts = {
    dontGlobal: ['.ico', 'fira.css', 'javascript-logo.png'],
    dontRenameFile: ['.ico', '.html', /fonts/],
    dontSearchFile: ['.js'],
    debug: false,
  }

  return gulp.src('./app/**/*')
  .pipe(RevAll.revision(revAllOpts))
  .pipe(gulp.dest('build'))
})

gulp.task('cname', function () {
  return gulp.src('CNAME')
  .pipe(gulp.dest('build'))
})

gulp.task('gitignore', function () {
  return gulp.src('.gitignore', { allowEmpty: true })
  .pipe(gulp.dest('build'))
})

gulp.task('clean', function () {
  return gulp.src('./build', { allowEmpty: true })
  .pipe(clean())
})

gulp.task('push-gh-pages', function () {
  return gulp.src('build/**/*')
  .pipe(ghPages())
})

gulp.task('build', gulp.series('clean', gulp.parallel('assets', 'cname', 'gitignore')))

gulp.task('deploy', gulp.series('build', 'push-gh-pages'))
