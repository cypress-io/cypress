const gulp = require('gulp')
const RevAll = require('gulp-rev-all')
const clean = require('gulp-clean')
const runSequence = require('run-sequence')

const revisionOpts = {
  dontGlobal: ['.ico', 'sitemap.xml', 'sitemap.xsl', 'logo.png'],
  dontRenameFile: ['.html', 'CNAME'],
  dontUpdateReference: ['.html'],
  dontSearchFile: ['.js'],
  debug: true,
}

function remove (folder) {
  return gulp
  .src(folder)
  .pipe(clean())
}

gulp.task('revision', () => {
  return gulp
  .src('public/**')
  .pipe(RevAll.revision(revisionOpts))
  .pipe(gulp.dest('tmp'))
})

gulp.task('copyTmpToPublic', () => {
  return gulp
  .src('tmp/**')
  .pipe(gulp.dest('public'))
})

gulp.task('clean:js', () => {
  return remove('public/js/!(application).js')
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
  runSequence('clean:js', 'revision', 'clean:public', 'copyTmpToPublic', 'clean:tmp', 'cname', cb)
})
