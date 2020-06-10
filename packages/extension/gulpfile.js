const fs = require('fs-extra')
const pkg = require('./package.json')
const gulp = require('gulp')
const rimraf = require('rimraf')
const source = require('vinyl-source-stream')
const browserify = require('browserify')
const cypressIcons = require('@cypress/icons')

const copySocketClient = () => {
  return gulp.src(require('../socket').getPathToClientSource())
  .pipe(gulp.dest('dist'))
}

const clean = (done) => {
  rimraf('dist', done)
}

const manifest = (done) => {
  gulp.src('app/manifest.json')
  .pipe(gulp.dest('dist'))
  .on('end', () => {
    return fs.readJson('dist/manifest.json', function (err, json) {
      json.version = pkg.version

      return fs.writeJson('dist/manifest.json', json, { spaces: 2 }, done)
    })
  })

  return null
}

const background = () => {
  return browserify({
    entries: 'app/init.js',
  })
  .bundle()
  .pipe(source('background.js'))
  .pipe(gulp.dest('dist'))
}

const html = () => {
  return gulp.src('app/**/*.html')
  .pipe(gulp.dest('dist'))
}

const css = () => {
  return gulp.src('app/**/*.css')
  .pipe(gulp.dest('dist'))
}

const icons = () => {
  return gulp.src([
    cypressIcons.getPathToIcon('icon_16x16.png'),
    cypressIcons.getPathToIcon('icon_19x19.png'),
    cypressIcons.getPathToIcon('icon_38x38.png'),
    cypressIcons.getPathToIcon('icon_48x48.png'),
    cypressIcons.getPathToIcon('icon_128x128.png'),
  ])
  .pipe(gulp.dest('dist/icons'))
}

const logos = () => {
  return gulp.src([
    cypressIcons.getPathToLogo('cypress-bw.png'),
  ])
  .pipe(gulp.dest('dist/logos'))
}

const build = gulp.series(
  clean,
  gulp.parallel(
    copySocketClient,
    icons,
    logos,
    manifest,
    background,
    html,
    css,
  ),
)

const watchBuild = () => {
  return gulp.watch('app/**/*', build)
}

const watch = gulp.series(build, watchBuild)

module.exports = {
  build,
  clean,
  watch,
}
