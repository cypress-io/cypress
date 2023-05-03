import gulp from 'gulp'
import rimraf from 'rimraf'
import { waitUntilIconsBuilt } from '../../scripts/ensure-icons'
import cp from 'child_process'
import * as path from 'path'

const nodeWebpack = path.join(__dirname, '..', '..', 'scripts', 'run-webpack.js')

async function cypressIcons () {
  await waitUntilIconsBuilt()

  return require('@packages/icons')
}

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

const icons = async () => {
  const cyIcons = await cypressIcons()

  return gulp.src([
    cyIcons.getPathToIcon('icon_16x16.png'),
    cyIcons.getPathToIcon('icon_19x19.png'),
    cyIcons.getPathToIcon('icon_38x38.png'),
    cyIcons.getPathToIcon('icon_48x48.png'),
    cyIcons.getPathToIcon('icon_128x128.png'),
  ])
  .pipe(gulp.dest('dist/icons'))
}

const logos = async () => {
  const cyIcons = await cypressIcons()

  // appease TS
  return gulp.src([
    cyIcons.getPathToLogo('cypress-bw.png'),
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
