'use strict'

const autoprefixer = require('gulp-autoprefixer')
const babel = require('gulp-babel')
const gulp = require('gulp')
const pathUtil = require('path')
const plumber = require('gulp-plumber')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const sassGlobbing = require('node-sass-globbing')
const watch = require('gulp-watch')

function handleError (error) {
  console.error(error.stack || `${error.plugin}: ${error.message}`)
}

function isArray (value) {
  return Object.prototype.toString.call(value) === '[object Array]'
}

const stylesheetsGlob = 'src/**/*.scss'
const scriptsGlob = 'src/**/*.+(js|jsx)'


function buildStylesheets () {
  console.log('build stylesheets')
  let firstTime = true
  return gulp.src('src/main.scss')
    .pipe(plumber(handleError))
    .pipe(sass({
      importer: sassGlobbing,
      sourceComments: true,
      outputStyle: 'expanded',
    }))
    .pipe(autoprefixer({ browsers: ['last 2 versions'], cascade: false }))
    .pipe(rename('reporter.css'))
    .pipe(gulp.dest('dist'))
    .on('end', () => {
      if (firstTime) {
        firstTime = false
        return
      }
      console.log('Stylesheets re-compiled')
    })
}

gulp.task('build-stylesheets', buildStylesheets)

gulp.task('watch-stylesheets', ['build-stylesheets'], () => {
  return watch(stylesheetsGlob, buildStylesheets)
})


function buildScripts (globOrFile) {
  let file = globOrFile
  let log = globOrFile
  let dest = 'dist'

  if (!isArray(globOrFile)) {
    file = globOrFile.path
    log = pathUtil.basename(file)
    dest = pathUtil.dirname(file).replace('src', 'dist').replace(`${__dirname}/`, '')
  }

  console.log('babel', log)
  return gulp.src(file)
    .pipe(plumber(handleError))
    .pipe(babel({
      plugins: [
        'babel-plugin-transform-decorators-legacy',
        'babel-plugin-add-module-exports',
      ],
      presets: ['es2015', 'react', 'stage-1'],
    }))
    .pipe(gulp.dest(dest))
}

gulp.task('build-scripts', () => {
  return buildScripts([scriptsGlob])
})

gulp.task('watch-scripts', ['build-scripts'], () => {
  return watch(scriptsGlob, (file) => {
    return buildScripts(file)
  })
})


gulp.task('watch', ['watch-scripts', 'watch-stylesheets'])
gulp.task('build', ['build-scripts', 'build-stylesheets'])
