let gulp = require('gulp')
let ghPages = require('gulp-gh-pages-will')
let clean = require('gulp-clean')
let RevAll = require('gulp-rev-all')
let runSequence = require('run-sequence')

gulp.task('assets', function () {
  let revAll = new RevAll({
    dontGlobal: ['.ico', 'fira.css', 'javascript-logo.png'],
    dontRenameFile: ['.ico', '.html', /fonts/],
    dontSearchFile: ['.js'],
    debug: false,
  })

  return gulp.src('./app/**/*')
  .pipe(revAll.revision())
  .pipe(gulp.dest('build'))
})

gulp.task('cname', function () {
  return gulp.src('CNAME')
  .pipe(gulp.dest('build'))
})

gulp.task('gitignore', function () {
  return gulp.src('.gitignore')
  .pipe(gulp.dest('build'))
})

gulp.task('clean', function () {
  return gulp.src('./build')
  .pipe(clean())
})

gulp.task('push-gh-pages', function () {
  return gulp.src('build/**/*')
  .pipe(ghPages())
})

gulp.task('build', function (cb) {
  return runSequence('clean', ['assets', 'cname', 'gitignore'], cb)
})

gulp.task('deploy', function (cb) {
  return runSequence('build', 'push-gh-pages', cb)
})
