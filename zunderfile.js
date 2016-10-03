var gulp = require("gulp")
var concat = require('gulp-concat')
var zunder = require("zunder")
var setZunderConfig = require('./scripts/set-zunder-config')

setZunderConfig(zunder)

function copyScripts (dir) {
  return function () {
    return gulp.src([
      "node_modules/jquery/dist/jquery.js",
      "node_modules/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js",
      "node_modules/bootstrap-sass/assets/javascripts/bootstrap/alert.js",
    ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(dir))
  }
}

zunder.on("before:watch", copyScripts(zunder.config.devDir))
zunder.on("before:build-dev", copyScripts(zunder.config.devDir))
zunder.on("before:build-prod", copyScripts(zunder.config.prodDir))
