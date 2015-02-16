path           = require("path")
fs             = require("fs-extra")
Promise        = require("bluebird")
child_process  = require("child_process")
glob           = require "glob"
gulp           = require("gulp")
$              = require('gulp-load-plugins')()
gutil          = require("gulp-util")
NwBuilder      = require("node-webkit-builder")

fs = Promise.promisifyAll(fs)

require path.join(process.cwd(), "gulpfile.coffee")

distDir = path.join(process.cwd(), "dist")

module.exports =
  prepare: ->
    new Promise (resolve, reject) ->
      ## clean/setup dist directories
      fs.removeSync(distDir)
      fs.ensureDirSync(distDir)

      ## copy root files
      fs.copySync("./package.json", distDir + "/package.json")
      fs.copySync("./config/app.yml", distDir + "/config/app.yml")
      fs.copySync("./lib/html", distDir + "/lib/html")
      fs.copySync("./lib/public", distDir + "/lib/public")
      fs.copySync("./nw/public", distDir + "/nw/public")

      ## copy coffee src files
      fs.copySync("./lib/cypress.coffee", distDir + "/src/lib/cypress.coffee")
      fs.copySync("./lib/controllers", distDir + "/src/lib/controllers")
      fs.copySync("./lib/util", distDir + "/src/lib/util")
      fs.copySync("./lib/routes", distDir + "/src/lib/routes")
      fs.copySync("./lib/cache.coffee", distDir + "/src/lib/cache.coffee")
      fs.copySync("./lib/id_generator.coffee", distDir + "/src/lib/id_generator.coffee")
      fs.copySync("./lib/keys.coffee", distDir + "/src/lib/keys.coffee")
      fs.copySync("./lib/logger.coffee", distDir + "/src/lib/logger.coffee")
      fs.copySync("./lib/project.coffee", distDir + "/src/lib/project.coffee")
      fs.copySync("./lib/server.coffee", distDir + "/src/lib/server.coffee")
      fs.copySync("./lib/socket.coffee", distDir + "/src/lib/socket.coffee")

      resolve()

  convertToJs: ->
    ## grab everything in src
    ## convert to js
    new Promise (resolve, reject) ->
      gulp.src(distDir + "/src/**/*.coffee")
        .pipe $.coffee()
        .pipe gulp.dest(distDir + "/src")
        .on "end", resolve
        .on "error", reject

  obfuscate: ->
    ## obfuscate all the js files
    new Promise (resolve, reject) ->
      ## grab all of the js files
      files = glob.sync(distDir + "/src/**/*.js")

      ## root is src
      ## entry is cypress.js
      ## files are all the js files
      opts = {root: distDir + "/src", entry: distDir + "/src/lib/cypress.js", files: files}

      obfuscator = require('obfuscator').obfuscator
      obfuscator opts, (err, obfuscated) ->
        return reject(err) if err

        ## move to lib
        fs.writeFileSync(distDir + "/lib/cypress.js", obfuscated)

        resolve(obfuscated)

  cleanup: ->
    ## delete src
    fs.removeAsync(distDir + "/src")


    # deploy = new Promise (resolve, reject) =>
    #   @npmInstall(distDir, resolve, reject)
    # deploy.then =>
    #   @updatePackage()
    # deploy

  dist: (cb) ->
    Promise.bind(@)
      .then(@prepare)
      .then(@updatePackage)
      .then(@convertToJs)
      .then(@obfuscate)
      .then(@cleanup)
      # .then(@npmCopy)
      .then(@npmInstall)
      .then ->
        console.log gutil.colors.green("Done Dist!")
        cb?()
      .catch (err) ->
        console.log gutil.colors.red("Dist Failed!")
        console.log err
        console.log gutil.colors.red("Dist Failed!")

  ## add tests around this method
  updatePackage: ->
    json = distDir + "/package.json"
    pkg  = fs.readJsonSync(json)
    pkg.env = "production"
    delete pkg.devDependencies
    delete pkg.bin

    if process.argv[3] is "--bin"
      pkg.snapshot = "lib/secret_sauce.bin"
      fs.copySync("./lib/secret_sauce.bin", distDir + "/lib/secret_sauce.bin")
    else
      fs.copySync("./lib/secret_sauce.coffee", distDir + "/src/lib/secret_sauce.coffee")

    fs.writeJsonSync(json, pkg, null, 2)

  npmCopy: ->
    fs.copyAsync("./node_modules", distDir + "/node_modules")

  npmInstall: ->
    new Promise (resolve, reject) ->
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
            fs.writeFileSync(distDir + "/npm-install.log", stdout)
          resolve()

      console.log gutil.colors.yellow("running 'npm install'")
      npmInstall()

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