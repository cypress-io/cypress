config         = require("konfig")()
path           = require("path")
fs             = require("fs-extra")
Promise        = require("bluebird")
child_process  = require("child_process")
glob           = require("glob")
gulp           = require("gulp")
$              = require('gulp-load-plugins')()
gutil          = require("gulp-util")
inquirer       = require("inquirer")
NwBuilder      = require("node-webkit-builder")

fs = Promise.promisifyAll(fs)

require path.join(process.cwd(), "gulpfile.coffee")

distDir  = path.join(process.cwd(), "dist")
buildDir = path.join(process.cwd(), "build")

class Deploy
  constructor: ->
    if not (@ instanceof Deploy)
      return new Deploy()

    @version          = null
    @publisher        = null
    @publisherOptions = {}
    @zip              = "cypress.zip"

  getVersion: ->
    @version ? throw new Error("Deploy#version was not defined!")

  setVersion: ->
    @log("#setVersion")

    @version = fs.readJsonSync(distDir + "/package.json").version

  getPublisher: ->
    aws = fs.readJsonSync("./aws-credentials.json")

    @publisher ?= $.awspublish.create
      bucket:          config.app.s3.bucket
      accessKeyId:     aws.key
      secretAccessKey: aws.secret

  prepare: ->
    @log("#prepare")

    p = new Promise (resolve, reject) ->
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
      fs.copySync("./lib/updater.coffee", distDir + "/src/lib/updater.coffee")

      ## copy test files
      # fs.copySync("./spec/server/unit/konfig_spec.coffee", distDir + "/spec/server/unit/konfig_spec.coffee")
      # fs.copySync("./spec/server/unit/url_helpers_spec.coffee", distDir + "/spec/server/unit/url_helpers_spec.coffee")
      # fs.removeSync(distDir + "/spec/server/unit/deploy_spec.coffee")

      resolve()

    p.bind(@)

  convertToJs: ->
    @log("#convertToJs")

    ## grab everything in src
    ## convert to js
    new Promise (resolve, reject) ->
      gulp.src(distDir + "/src/**/*.coffee")
        .pipe $.coffee()
        .pipe gulp.dest(distDir + "/src")
        .on "end", resolve
        .on "error", reject

  obfuscate: ->
    @log("#obfuscate")

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

  cleanupSrc: ->
    @log("#cleanupSrc")

    fs.removeAsync(distDir + "/src")

  cleanupDist: ->
    @log("#cleanupDist")

    fs.removeAsync(distDir)

  cleanupBuild: ->
    @log("#cleanupBuild")

    fs.removeAsync(buildDir)

  runTests: ->
    new Promise (resolve, reject) ->
      ## change into our distDir as process.cwd()
      process.chdir(distDir)

      ## require cypress to get the require path's cached
      require(distDir + "/lib/cypress")

      ## run all of our tests
      gulp.src(distDir + "/spec/server/unit/**/*")
        .pipe $.mocha()
        .on "error", reject
        .on "end", resolve

  build: ->
    @log("#build")

    new Promise (resolve, reject) =>
      version = @getVersion()
      fs.removeSync(buildDir)
      fs.copySync("./cache/0.11.6/osx64/node-webkit.app", "#{buildDir}/#{version}/cypress.app")
      fs.copySync(distDir, "#{buildDir}/#{version}/cypress.app/Contents/Resources/app.nw")

      resolve()

  zipBuild: ->
    @log("#zipBuild")

    new Promise (resolve, reject) =>
      version = @getVersion()
      gulp.src("#{buildDir}/#{version}/**/*")
        .pipe $.zip(@zip)
        .pipe gulp.dest("#{buildDir}/#{version}")
        .on "error", reject
        .on "end", resolve

  getQuestions: (version) ->
    [{
      name: "publish"
      type: "confirm"
      message: "Publish a new version?"
      default: true
    },{
      name: "version"
      type: "input"
      message: "Bump version? (current is: #{version})"
      default: ->
        a = version.split(".")
        v = a[a.length - 1]
        v = Number(v) + 1
        a.splice(a.length - 1, 1, v)
        a.join(".")
      when: (answers) ->
        answers.publish
    }]

  updateLocalPackageJson: (version) ->
    json = fs.readJsonSync("./package.json")
    json.version = version
    @writeJsonSync("./package.json", json)

  writeJsonSync: (path, obj) ->
    fs.writeJsonSync(path, obj, null, 2)

  ## add tests around this method
  updatePackages: ->
    @log("#updatePackages")

    new Promise (resolve, reject) =>
      json = distDir + "/package.json"
      pkg  = fs.readJsonSync(json)
      pkg.env = "production"

      ## publish a new version?
      ## if yes then prompt to increment the package version number
      ## display existing number + offer to increment by 1
      inquirer.prompt @getQuestions(pkg.version), (answers) =>
        ## set the new version if we're publishing!
        ## update our own local package.json as well
        if answers.publish
          pkg.version = answers.version
          @updateLocalPackageJson(answers.version)

        delete pkg.devDependencies
        delete pkg.bin

        if process.argv[3] is "--bin"
          pkg.snapshot = "lib/secret_sauce.bin"
          fs.copySync("./lib/secret_sauce.bin", distDir + "/lib/secret_sauce.bin")
        else
          fs.copySync("./lib/secret_sauce.coffee", distDir + "/src/lib/secret_sauce.coffee")

        @writeJsonSync(json, pkg)

        resolve()

  npmCopy: ->
    fs.copyAsync("./node_modules", distDir + "/node_modules")

  npmInstall: ->
    @log("#npmInstall")

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
            fs.writeFileSync(distDir + "/npm-install.log", stdout)
          resolve()

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
      fs.copySync("./cache/0.11.6/osx64/node-webkit.app", "#{buildDir}/cypress.app")
      fs.copySync("./dist", "#{buildDir}/cypress.app/Contents/Resources/app.nw")
      resolve()

    compile
      .then ->
        console.log gutil.colors.green("Done Compiling!")
      .then(cb)
      .catch (err) ->
        console.log gutil.colors.red("Compiling Failed!")
        console.log err
        console.log gutil.colors.red("Compiling Failed!")

  uploadToS3: (dirname) ->
    @log("#uploadToS3")

    new Promise (resolve, reject) =>
      publisher = @getPublisher()
      options = @publisherOptions

      headers = {}
      headers["Cache-Control"] = "no-cache"

      version = @getVersion()

      gulp.src("#{buildDir}/#{version}/#{@zip}")
        .pipe $.rename (p) ->
          p.dirname = (dirname or version) + "/"
          p
        .pipe publisher.publish(headers, options)
        .pipe $.awspublish.reporter()
        .on "error", reject
        .on "end", resolve

  uploadFixtureToS3: ->
    @log("#uploadFixtureToS3")

    @uploadToS3("fixture")

  createRemoteManifest: ->
    ## this isnt yet taking into account the os
    ## because we're only handling mac right now
    getUrl = (os) =>
      {
        url: [config.app.s3.path, config.app.s3.bucket, @version, @zip].join("/")
      }

    obj = {
      name: "cypress"
      version: @getVersion()
      packages: {
        mac: getUrl("mac")
        win: getUrl("win")
        linux: getUrl("linux")
      }
    }

    src = "#{buildDir}/manifest.json"
    fs.outputJsonAsync(src, obj).return(src)

  updateS3Manifest: ->
    @log("#updateS3Manifest")

    publisher = @getPublisher()
    options = @publisherOptions

    headers = {}
    headers["Cache-Control"] = "no-cache"

    new Promise (resolve, reject) =>
      @createRemoteManifest().then (src) ->
        gulp.src(src)
          .pipe publisher.publish(headers, options)
          .pipe $.awspublish.reporter()
          .on "error", reject
          .on "end", resolve

  fixture: (cb) ->
    Promise.bind(@)
      .then(@prepare)
      .then(@updatePackages)
      .then(@setVersion)
      .then(@convertToJs)
      .then(@obfuscate)
      .then(@cleanupSrc)
      .then(@npmInstall)
      .then(@build)
      .then(@cleanupDist)
      .then(@zipBuild)
      .then(@uploadFixtureToS3)
      .then(@cleanupBuild)
      .then ->
        @log("Fixture Complete!", "green")
        cb?()
      .catch (err) ->
        @log("Fixture Failed!", "red")
        console.log err

  log: (msg, color = "yellow") ->
    return if process.env["NODE_ENV"] is "test"
    console.log gutil.colors[color](msg)

  dist: (cb) ->
    Promise.bind(@)
      .then(@prepare)
      .then(@updatePackages)
      .then(@setVersion)
      .then(@convertToJs)
      .then(@obfuscate)
      .then(@cleanupSrc)
      # .then(@npmCopy)
      .then(@npmInstall)
      # .then(@runTests)
      .then(@build)
      .then(@cleanupDist)
      .then(@zipBuild)
      .then(@uploadToS3)
      .then(@updateS3Manifest)
      .then(@cleanupBuild)
      .then ->
        @log("Dist Complete!", "green")
        cb?()
      .catch (err) ->
        @log("Dist Failed!", "red")
        console.log err

module.exports = Deploy