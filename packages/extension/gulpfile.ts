import gulp from 'gulp'
import rimraf from 'rimraf'
import * as cypressIcons from '@packages/icons'
import cp from 'child_process'
import * as path from 'path'

const nodeWebpack = path.join(__dirname, '..', '..', 'scripts', 'run-webpack.js')

const clean = (done) => {
  rimraf('dist', done)
}

const manifest = () => {
  return gulp.src('app/manifest.json')
  .pipe(gulp.dest('dist'))
}

const background = (cb) => {
  cp.fork(nodeWebpack, { stdio: 'inherit' }).on('exit', (code) => {
    cb(code === 0 ? null : new Error(`Webpack process exited with code ${code}`))
  })
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
