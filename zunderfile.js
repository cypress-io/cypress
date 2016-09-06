var gulp = require("gulp")
var concat = require('gulp-concat')
var zunder = require("zunder")
var cyIcons = require('@cypress/core-icons')

var staticGlobs = {
  'node_modules/fira/woff/**/*': '/woff',
  'node_modules/font-awesome/fonts/*.+(eot|svg|ttf|woff|woff2|otf)': '/fonts',
}
staticGlobs[cyIcons.getPathToLogo('cypress-inverse.png')] = '/img'

zunder.setConfig({
  prodDir: 'dist',
  staticGlobs: staticGlobs
})


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
zunder.on("before:build-prod", copyScripts(zunder.config.prodDir))
