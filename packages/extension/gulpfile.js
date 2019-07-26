/* eslint-disable
    @cypress/dev/no-return-before,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require('fs-extra')
const pkg = require('./package.json')
const gulp = require('gulp')
const clean = require('gulp-clean')
const rename = require('gulp-rename')
const runSeq = require('run-sequence')
const source = require('vinyl-source-stream')
const Promise = require('bluebird')
const coffeeify = require('coffeeify')
const browserify = require('browserify')
const icons = require('@cypress/icons')

gulp.task('clean', () => {
  return gulp.src('dist')
  .pipe(clean())
})

gulp.task('manifest', (done) => {
  gulp.src('app/manifest.json')
  .pipe(gulp.dest('dist'))
  .on('end', () => {
    return fs.readJson('dist/manifest.json', (err, json) => {
      json.version = pkg.version

      return fs.writeJson('dist/manifest.json', json, { spaces: 2 }, done)
    })
  })

  return null
})

gulp.task('backup', () => {
  return gulp.src('dist/background.js')
  .pipe(rename('background_src.js'))
  .pipe(gulp.dest('dist'))
})

gulp.task('background', () => {
  return browserify({
    entries: 'app/background.coffee',
    transform: coffeeify,
  })
  .bundle()
  .pipe(source('background.js'))
  .pipe(gulp.dest('dist'))
})

gulp.task('html', () => {
  return gulp.src('app/**/*.html')
  .pipe(gulp.dest('dist'))
})

gulp.task('css', () => {
  return gulp.src('app/**/*.css')
  .pipe(gulp.dest('dist'))
})

gulp.task('icons', () => {
  return gulp.src([
    icons.getPathToIcon('icon_16x16.png'),
    icons.getPathToIcon('icon_19x19.png'),
    icons.getPathToIcon('icon_38x38.png'),
    icons.getPathToIcon('icon_48x48.png'),
    icons.getPathToIcon('icon_128x128.png'),
  ])
  .pipe(gulp.dest('dist/icons'))
})

gulp.task('logos', () => {
  return gulp.src([
    icons.getPathToLogo('cypress-bw.png'),
  ])
  .pipe(gulp.dest('dist/logos'))
})

gulp.task('watch', ['build'], () => {
  return gulp.watch('app/**/*', ['build'])
})

gulp.task('build', () => {
  return runSeq('clean', [
    'icons',
    'logos',
    'manifest',
    'background',
    'html',
    'css',
  ])
})
