path           = require("path")
fs             = require("fs-extra")
Promise        = require("bluebird")
child_process  = require("child_process")
gulp           = require("gulp")
gutil          = require("gulp-util")

require path.join(process.cwd(), "gulpfile.coffee")

distDir = path.join(process.cwd(), "dist")

module.exports = (cb) ->
  fs.removeSync(distDir)
  fs.ensureDirSync(distDir)

  fs.copySync("./package.json", distDir + "/package.json")
  # fs.copySync("./bower.json", distDir + "/bower.json")
  fs.copySync("./bin/booter.coffee", distDir + "/bin/booter.coffee")
  fs.copySync("./config/app.yml", distDir + "/config/app.yml")
  fs.copySync("./lib/controllers", distDir + "/lib/controllers")
  fs.copySync("./lib/util", distDir + "/lib/util")
  fs.copySync("./lib/routes", distDir + "/lib/routes")
  fs.copySync("./lib/cache.coffee", distDir + "/lib/cache.coffee")
  fs.copySync("./lib/id_generator.coffee", distDir + "/lib/id_generator.coffee")
  fs.copySync("./lib/keys.coffee", distDir + "/lib/keys.coffee")
  fs.copySync("./lib/logger.coffee", distDir + "/lib/logger.coffee")
  fs.copySync("./lib/project.coffee", distDir + "/lib/project.coffee")
  fs.copySync("./lib/server.coffee", distDir + "/lib/server.coffee")
  fs.copySync("./lib/socket.coffee", distDir + "/lib/socket.coffee")
  fs.copySync("./lib/public", distDir + "/lib/public")
  fs.copySync("./nw/public", distDir + "/nw/public")

  deploy = new Promise (resolve, reject) ->
    attempts = 0

    npmInstall = ->
      attempts += 1

      child_process.exec "npm install --production", {cwd: distDir}, (err, stdout, stderr) ->
        if err
          return reject(err) if attempts is 3

          console.log gutil.colors.red("'npm install' failed, retrying")
          return npmInstall()
        else
          console.log gutil.colors.yellow("done 'npm install'")
        resolve()

    console.log gutil.colors.yellow("running 'npm install'")
    npmInstall(resolve, reject)

  deploy.then ->
    console.log gutil.colors.green("Done Deploying!")
    cb?()