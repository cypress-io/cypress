const gulp = require('gulp')
const RevAll = require('gulp-rev-all')
const clean = require('gulp-clean')
const runSequence = require('run-sequence')

const revisionOpts = {
  dontGlobal: ['.ico', 'sitemap.xml', 'sitemap.xsl', 'logo.png'],
  dontRenameFile: ['.html', 'CNAME'],
  dontUpdateReference: ['.html'],
  dontSearchFile: ['.js'],
  debug: true
}

function remove (folder) {
  return gulp
  .src(folder)
  .pipe(clean())
}

function moveJSNodeModule (path) {
  return gulp
  .src(`./node_modules/${path}`)
  .pipe(gulp.dest('./themes/cypress/source/js'))
}

function moveCSSNodeModule (path) {
  return gulp
  .src(`./node_modules/${path}`)
  .pipe(gulp.dest('./themes/cypress/source/css'))
}

gulp.task('move:menu:spy:js', function () {
  return moveJSNodeModule('menuspy/dist/menuspy.js')
})

gulp.task('move:scrolling:element:js', function () {
  return moveJSNodeModule('scrollingelement/scrollingelement.js')
})

gulp.task('move:doc:search:js', function () {
  return moveJSNodeModule('docsearch.js/dist/cdn/docsearch.js')
})

gulp.task('move:doc:search:css', function () {
  return moveCSSNodeModule('docsearch.js/dist/cdn/docsearch.css')
})

gulp.task('revision', () => {
  return gulp
  .src('public/**')
  .pipe(RevAll.revision(revisionOpts))
  .pipe(gulp.dest('tmp'))
})

gulp.task('copy:tmp:to:public', () => {
  return gulp
  .src('tmp/**')
  .pipe(gulp.dest('public'))
})

gulp.task('clean:js', () => {
  return remove('public/js/!(application).js')
})

gulp.task('clean:css', () => {
  return remove('public/css/!(style|prism-coy).css')
})

gulp.task('clean:tmp', () => {
  return remove('tmp')
})

gulp.task('clean:public', () => {
  return remove('public')
})

gulp.task('cname', () => {
  return gulp.src('CNAME').pipe(gulp.dest('public'))
})

gulp.task('post:build', (cb) => {
  runSequence('copy:static:assets', 'clean:js', 'clean:css', 'revision', 'clean:public', 'copy:tmp:to:public', 'clean:tmp', 'cname', cb)
})

gulp.task('copy:static:assets', ['move:menu:spy:js', 'move:scrolling:element:js', 'move:doc:search:js', 'move:doc:search:css'])
