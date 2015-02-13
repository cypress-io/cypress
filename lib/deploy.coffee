path           = require("path")
fs             = require("fs-extra")
Promise        = require("bluebird")
child_process  = require("child_process")
gulp           = require("gulp")
gutil          = require("gulp-util")
NwBuilder      = require("node-webkit-builder")

require path.join(process.cwd(), "gulpfile.coffee")

distDir = path.join(process.cwd(), "dist")

module.exports =
  dist: (cb) ->
    fs.removeSync(distDir)
    fs.ensureDirSync(distDir)

    fs.copySync("./package.json", distDir + "/package.json")
    # fs.copySync("./bower.json", distDir + "/bower.json")
    fs.copySync("./bin/booter.coffee", distDir + "/bin/booter.coffee")
    fs.copySync("./config/app.yml", distDir + "/config/app.yml")
    fs.copySync("./lib/html", distDir + "/lib/html")
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

    deploy = new Promise (resolve, reject) =>
      @npmInstall(distDir, resolve, reject)
    deploy.then =>
      @updatePackage()
    deploy.then ->
      console.log gutil.colors.green("Done Dist!")
      cb?()
    deploy.catch (err) ->
      console.log gutil.colors.red("Dist Failed!")
      console.log err
      console.log gutil.colors.red("Dist Failed!")

  ## add tests around this method
  updatePackage: ->
    if process.argv[3] is "--prod"
      json = distDir + "/package.json"
      pkg = fs.readJsonSync(json)
      pkg.snapshot = "lib/secret_sauce.bin"

      delete pkg.devDependencies
      delete pkg.bin

      fs.writeJsonSync(json, pkg, null, 2)

      fs.copySync("./lib/secret_sauce.bin", distDir + "/lib/secret_sauce.bin")
    else
      fs.copySync("./lib/secret_sauce.coffee", distDir + "/lib/secret_sauce.coffee")

  npmInstall: (cwd, resolve, reject) ->
    attempts = 0

    npmInstall = ->
      attempts += 1

      child_process.exec "npm install --production", {cwd: cwd}, (err, stdout, stderr) ->
        if err
          return reject(err) if attempts is 3

          console.log gutil.colors.red("'npm install' failed, retrying")
          return npmInstall()
        else
          console.log gutil.colors.yellow("done 'npm install'")
          fs.writeFileSync(cwd + "/npm-install.log", stdout)
        resolve()

    console.log gutil.colors.yellow("running 'npm install'")
    npmInstall(resolve, reject)

  compile: (cb) ->
    compile = new Promise (resolve, reject) =>
      # nw = new NwBuilder
      #   files: distDir + "/**/**"
      #   platforms: ["osx64"]
      #   buildType: "versioned"
      #   version: "0.11.6"

      # nw.on "log", console.log

      # nw
      #   .build()
      #   .then =>
      #     # console.log nw
      #     # @npmInstall("./build/eclectus%20-%20v0.1.0/osx64/eclectus.app/Contents/Resources/app.nw", resolve, reject)
      #     fs.copySync("./node_modules", "./build/eclectus - v0.1.0/osx64/eclectus.app/Contents/Resources/app.nw/node_modules")
      #   .then(resolve)
      #   .catch(reject)
      fs.copySync("./cache/0.11.6/osx64/node-webkit.app", "./build/cypress.app")
      fs.copySync("./dist", "./build/cypress.app/Contents/Resources/app.nw")
      resolve()

    compile
      .then ->
        console.log gutil.colors.green("Done Compiling!")
      .then(cb)
      .catch (err) ->
        console.log gutil.colors.red("Compiling Failed!")
        console.log err
        console.log gutil.colors.red("Compiling Failed!")