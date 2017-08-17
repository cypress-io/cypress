deploy = require("./deploy")

gulp.task "release", deploy.release

gulp.task "deploy", deploy.deploy

gulp.task "bump", deploy.bump
