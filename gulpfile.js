'use strict'

const autoprefixer = require('gulp-autoprefixer')
const babel = require('gulp-babel')
const fs = require('fs')
const gulp = require('gulp')
const gulpif = require('gulp-if')
const gutil = require('gulp-util')
const mocha = require('gulp-spawn-mocha')
const pathUtil = require('path')
const plumber = require('gulp-plumber')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const sassGlobbing = require('node-sass-globbing')
const through = require('through')
const watch = require('gulp-watch')

function handleError (error) {
  if (/Mocha exited/.test(error.message)) {
    return // ignore mocha exit errors
  }
  console.error(error.stack || `${error.plugin}: ${error.message}`)
}

function isArray (value) {
  return Object.prototype.toString.call(value) === '[object Array]'
}

const stylesheetsGlob = 'src/**/*.scss'
const scriptsGlob = 'src/**/*.+(js|jsx)'


function buildStylesheets () {
  gutil.log('build stylesheets')
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
      gutil.log('Stylesheets re-compiled')
    })
}

gulp.task('build-stylesheets', buildStylesheets)

gulp.task('watch-stylesheets', ['build-stylesheets'], () => {
  return watch(stylesheetsGlob, buildStylesheets)
})

function getSpecFile (file) {
  let fileName = file.basename.replace('.jsx', '.js')
  if (!/\.spec\./.test(fileName)) {
    fileName = fileName.replace('.js', '.spec.js')
  }
  var path = file.dirname.replace('src', 'dist')
  var filePath = `${path}/${fileName}`

  try {
    fs.statSync(filePath)
    return new gutil.File({ path: filePath })
  } catch (e) {
    // no spec file
    return null
  }
}

function passSpecFile (specFile) {
  return through(function () {
    if (specFile) this.queue(specFile)
  })
}

function buildScripts (globOrFile) {
  let file = globOrFile
  let log = globOrFile
  let dest = 'dist'

  if (!isArray(globOrFile)) {
    file = globOrFile.path
    log = pathUtil.basename(file)
    dest = pathUtil.dirname(file).replace('src', 'dist').replace(`${__dirname}/`, '')
  }

  gutil.log('babel', log)
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
    const specFile = getSpecFile(file)
    return buildScripts(file)
      .pipe(passSpecFile(specFile))
      .pipe(gulpif(!!specFile, mocha({
        r: 'lib/test-setup.js',
      })))
  })
})


gulp.task('watch', ['watch-scripts', 'watch-stylesheets'])
gulp.task('build', ['build-scripts', 'build-stylesheets'])
