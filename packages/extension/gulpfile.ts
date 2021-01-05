import fs from 'fs-extra'
import gulp from 'gulp'
import rimraf from 'rimraf'
import webpack from 'webpack'
import cypressIcons from '@cypress/icons'
import webpackConfig from './webpack.config.js'

const pkg = require('./package.json')

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

const background = (cb) => {
  const compiler = webpack(webpackConfig as webpack.Configuration)

  compiler.run(cb)
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
