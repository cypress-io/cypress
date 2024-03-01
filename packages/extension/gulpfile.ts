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

const manifest = (v: 'v2' | 'v3') => {
  return () => {
    return gulp.src(`app/${v}/manifest.json`)
    .pipe(gulp.dest(`dist/${v}`))
  }
}

const background = (cb) => {
  cp.fork(nodeWebpack, { stdio: 'inherit' }).on('exit', (code) => {
    cb(code === 0 ? null : new Error(`Webpack process exited with code ${code}`))
  })
}

const copyScriptsForV3 = () => {
  return gulp.src('app/v3/*.js')
  .pipe(gulp.dest('dist/v3'))
}

const html = () => {
  return gulp.src('app/**/*.html')
  .pipe(gulp.dest('dist/v2'))
  .pipe(gulp.dest('dist/v3'))
}

const css = () => {
  return gulp.src('app/**/*.css')
  .pipe(gulp.dest('dist/v2'))
  .pipe(gulp.dest('dist/v3'))
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
  .pipe(gulp.dest('dist/v2/icons'))
  .pipe(gulp.dest('dist/v3/icons'))
}

const logos = async () => {
  const cyIcons = await cypressIcons()

  // appease TS
  return gulp.src([
    cyIcons.getPathToLogo('cypress-bw.png'),
  ])
  .pipe(gulp.dest('dist/v2/logos'))
  .pipe(gulp.dest('dist/v3/logos'))
}

const build = gulp.series(
  clean,
  gulp.parallel(
    icons,
    logos,
    manifest('v2'),
    manifest('v3'),
    background,
    copyScriptsForV3,
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
