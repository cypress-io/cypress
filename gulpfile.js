const babel = require('gulp-babel')
const gulp = require('gulp')
const pathUtil = require('path');
const plumber = require('gulp-plumber')
const watch = require('gulp-watch')

function handleError (error) {
  console.error(error.stack || `${error.plugin}: ${error.message}`)
}

const stylesheetsGlob = 'src/**/*.scss'
const staticGlob = 'static/**'
const scriptsGlob = 'src/**/*.+(js|jsx)'

function copyStatic (files, changed) {
  console.log('copy', changed)
  return gulp.src(files).pipe(gulp.dest('dist'))
}

gulp.task('copy-static', () => {
  return copyStatic([stylesheetsGlob, staticGlob], [stylesheetsGlob, staticGlob])
})

gulp.task('watch-static', ['copy-static'], () => {
  return watch([stylesheetsGlob, staticGlob], (file) => {
    return copyStatic(file.path, pathUtil.basename(file.path))
  })
})


gulp.task('watch', ['watch-scripts', 'watch-static'])

function buildScripts (files, changed) {
  console.log('babel', changed)
  return gulp.src(files)
    .pipe(plumber(handleError))
    .pipe(babel({
      plugins: [
        'babel-plugin-transform-decorators-legacy',
        'babel-plugin-add-module-exports',
      ],
      presets: ['es2015', 'react', 'stage-1'],
    }))
    .pipe(gulp.dest('dist'))
}

gulp.task('build-scripts', () => {
  return buildScripts(scriptsGlob, scriptsGlob)
})

gulp.task('watch-scripts', ['build-scripts'], () => {
  return watch(scriptsGlob, (file) => {
    return buildScripts(file.path, pathUtil.basename(file.path))
  })
})


gulp.task('watch', ['watch-scripts', 'watch-static'])
gulp.task('build', ['build-scripts', 'copy-static'])
