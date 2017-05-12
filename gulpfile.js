var gulp        = require('gulp')
var RevAll      = require('gulp-rev-all')
var clean       = require('gulp-clean')
var debug       = require('gulp-debug')
var runSequence = require('run-sequence')

var revisionOpts = {
  dontGlobal: ['.ico', 'sitemap.xml', 'logo.png'],
  dontRenameFile: ['.html', 'CNAME'],
  dontUpdateReference: ['.html'],
  dontSearchFile: ['.js'],
  debug: true
}

function remove(folder) {
  return gulp
  .src(folder)
  .pipe(clean())
}

gulp.task('revision', function () {
  return gulp
  .src('public/**')
  .pipe(RevAll.revision(revisionOpts))
  .pipe(gulp.dest('tmp'))
})

gulp.task('copyTmpToPublic', function(){
  return gulp
  .src('tmp/**')
  .pipe(gulp.dest('public'))
})

gulp.task('clean:js', function(){
  return remove('public/js/!(application).js')
})

gulp.task('clean:tmp', function(){
  return remove('tmp')
})

gulp.task('clean:public', function(){
  return remove('public')
})

gulp.task('cname', function(){
  gulp.src('CNAME')
    .pipe(gulp.dest('public'))
})

gulp.task('prep', function (cb) {
  runSequence('clean:js', 'revision', 'clean:public', 'copyTmpToPublic', 'clean:tmp', 'cname', cb)
})
