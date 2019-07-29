/* eslint-disable
    @cypress/dev/no-return-before,
    no-unused-vars,
*/
const fs = require('fs-extra')
const pkg = require('./package.json')
const gulp = require('gulp')
const clean = require('gulp-clean')
const rename = require('gulp-rename')
const source = require('vinyl-source-stream')
const coffeeify = require('coffeeify')
const browserify = require('browserify')
const icons = require('@cypress/icons')

gulp.task('clean', () => {
  return gulp.src('dist', { allowEmpty: true })
  .pipe(clean())
})

gulp.task('manifest', (done) => {
  return gulp.src('app/manifest.json')
  .pipe(gulp.dest('dist'))
  .on('end', () => {
    return fs.readJson('dist/manifest.json', (err, json) => {
      json.version = pkg.version

      return fs.writeJson('dist/manifest.json', json, { spaces: 2 }, done)
    })
  })
})

gulp.task('backup', () => {
  return gulp.src('dist/background.js')
  .pipe(rename('background_src.js'))
  .pipe(gulp.dest('dist'))
})

gulp.task('background', () => {
  return browserify({
    entries: 'app/init.js',
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

gulp.task('build', gulp.series('clean', gulp.parallel(
  'icons',
  'logos',
  'manifest',
  'background',
  'html',
  'css',
)))

gulp.task('watch', gulp.series('build'), (done) => {
  gulp.watch('app/**/*', gulp.series('build'))
  done()
})
