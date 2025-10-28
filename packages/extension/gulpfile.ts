import { promisify } from 'util'
import { exec } from 'child_process'
import gulp from 'gulp'
import { rimraf } from 'rimraf'
import { getPathToIcon, getPathToLogo } from '@packages/icons'

const execAsync = promisify(exec)

export async function clean (): Promise<boolean> {
  const removedAppDist = await rimraf('app-dist')
  const removedLibDist = await rimraf('lib-dist')

  return removedAppDist && removedLibDist
}

const manifest = (v: 'v2' | 'v3') => {
  return () => {
    return gulp.src(`app/${v}/manifest.json`)
    .pipe(gulp.dest(`app-dist/${v}`))
  }
}

const buildAppV2 = async () => {
  await execAsync('yarn build:v2')
}

const buildAppV3 = async () => {
  await execAsync('yarn build:v3')
}

const buildLib = async () => {
  await execAsync('yarn build:lib')
}

const html = () => {
  return gulp.src('app/**/*.html')
  .pipe(gulp.dest('app-dist/v2'))
  .pipe(gulp.dest('app-dist/v3'))
}

const css = () => {
  return gulp.src('app/**/*.css')
  .pipe(gulp.dest('app-dist/v2'))
  .pipe(gulp.dest('app-dist/v3'))
}

const icons = async () => {
  return gulp.src([
    getPathToIcon('icon_16x16.png'),
    getPathToIcon('icon_19x19.png'),
    getPathToIcon('icon_38x38.png'),
    getPathToIcon('icon_48x48.png'),
    getPathToIcon('icon_128x128.png'),
  ])
  .pipe(gulp.dest('app-dist/v2/icons'))
  .pipe(gulp.dest('app-dist/v3/icons'))
}

const logos = async () => {
  // appease TS
  return gulp.src([
    getPathToLogo('cypress-bw.png'),
  ])
  .pipe(gulp.dest('app-dist/v2/logos'))
  .pipe(gulp.dest('app-dist/v3/logos'))
}

export const build = gulp.series(
  clean,
  buildAppV2,
  buildAppV3,
  gulp.parallel(
    icons,
    logos,
    manifest('v2'),
    manifest('v3'),
    html,
    css,
    buildLib,
  ),
)

const watchBuild = () => {
  return gulp.watch('app/**/*', build)
}

export const watch = gulp.series(build, watchBuild)
