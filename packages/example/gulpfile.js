let gulp = require('gulp')
let ghPages = require('gulp-gh-pages')
let gulpClean = require('gulp-clean')
let RevAll = require('gulp-rev-all')

const assets = () => {
  const revAllOpts = {
    dontGlobal: ['.ico', 'fira.css', 'javascript-logo.png'],
    dontRenameFile: ['.ico', '.html', /fonts/],
    dontSearchFile: ['.js'],
    debug: false,
  }

  return gulp.src('./app/**/*')
  .pipe(RevAll.revision(revAllOpts))
  .pipe(gulp.dest('build'))
}

const cname = () => {
  return gulp.src('CNAME', { allowEmpty: true })
  .pipe(gulp.dest('build'))
}

const clean = () => {
  return gulp.src('./build', { allowEmpty: true })
  .pipe(gulpClean())
}

const pushGhPages = () => {
  return gulp.src('build/**/*')
  .pipe(ghPages())
}

const build = gulp.series(clean, gulp.parallel(assets, cname))

exports.build = build

exports.deploy = gulp.series(build, pushGhPages)
