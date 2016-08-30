var gulp = require("gulp")
var concat  = require('gulp-concat')
var zunder = require("zunder")
var Promise = require('bluebird')
var cyIcons = require('@cypress/core-icons')

function copyScripts (dir) {
  return function () {
    return Promise.all([
      gulp.src([
        "node_modules/jquery/dist/jquery.js",
        "node_modules/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js",
        "node_modules/bootstrap-sass/assets/javascripts/bootstrap/alert.js",
      ])
      .pipe(concat('vendor.js'))
      .pipe(gulp.dest(dir)),

      gulp.src("node_modules/fira/woff/**/*")
        .pipe(gulp.dest(dir + "/woff")),

      gulp.src("node_modules/font-awesome/fonts/**")
        .pipe(gulp.dest(dir + "/fonts")),

      gulp.src(cyIcons.getPathToLogo('cypress-inverse.png'))
        .pipe(gulp.dest(dir + '/img')),
    ])
  }
}

zunder.on("before:watch", copyScripts(zunder.config.devDir))
zunder.on("before:build-prod", copyScripts(zunder.config.prodDir))
