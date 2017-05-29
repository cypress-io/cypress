const gulp  = require("gulp")
const icons = require("../icons")

gulp.task("favicon", () => {
  return gulp.src(icons.getPathToFavicon("**/**"))
  .pipe(gulp.dest("./dist"))
})

gulp.task("build", ["favicon"])
