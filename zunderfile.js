var gulp = require("gulp");
var zunder = require("zunder");

function copyScripts (dir) {
  return function () {
    gulp.src("bower_components/jquery/dist/jquery.js")
    .pipe(gulp.dest(dir));
    gulp.src("bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/dropdown.js")
    .pipe(gulp.dest(dir));
    gulp.src("bower_components/fira/woff/**/*")
    .pipe(gulp.dest(dir + "/woff"));
    gulp.src("bower_components/font-awesome/fonts/**")
    .pipe(gulp.dest(dir + "/fonts"));
  }
}

zunder.on("before:watch", copyScripts(zunder.config.devDir));
zunder.on("before:build-prod", copyScripts(zunder.config.prodDir));
