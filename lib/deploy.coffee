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

distDir = path.join(process.cwd(), "dist")

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
    @version = fs.readJsonSync(distDir + "/package.json").version

  getPublisher: ->
    @publisher ?= $.awspublish.create
      bucket:          config.app.s3.bucket
      accessKeyId:     config.app.s3.access_key
      secretAccessKey: config.app.s3.secret_key

  prepare: ->
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

      ## copy test files
      # fs.copySync("./spec/server/unit/konfig_spec.coffee", distDir + "/spec/server/unit/konfig_spec.coffee")
      # fs.copySync("./spec/server/unit/url_helpers_spec.coffee", distDir + "/spec/server/unit/url_helpers_spec.coffee")
      # fs.removeSync(distDir + "/spec/server/unit/deploy_spec.coffee")

      resolve()

    p.bind(@)

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

  cleanupSrc: ->
    ## delete src
    fs.removeAsync(distDir + "/src")

  cleanupDist: ->
    fs.removeAsync(distDir)

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

  package: ->
    new Promise (resolve, reject) =>
      version = @getVersion()
      fs.removeSync("./build")
      fs.copySync("./cache/0.11.6/osx64/node-webkit.app", "./build/#{version}/cypress.app")
      fs.copySync(distDir, "./build/#{version}/cypress.app/Contents/Resources/app.nw")

      resolve()

  zipPackage: ->
    new Promise (resolve, reject) =>
      version = @getVersion()
      gulp.src("./build/#{version}/**/*")
        .pipe $.zip(@zip)
        .pipe gulp.dest("./build/#{version}")
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

  ## add tests around this method
  updatePackage: ->
    new Promise (resolve, reject) =>
      json = distDir + "/package.json"
      pkg  = fs.readJsonSync(json)
      pkg.env = "production"

      ## publish a new version?
      ## if yes then prompt to increment the package version number
      ## display existing number + offer to increment by 1
      inquirer.prompt @getQuestions(pkg.version), (answers) ->
        ## set the new version if we're publishing!
        ## update our own local package.json as well
        if answers.publish
          pkg.version = answers.version

        delete pkg.devDependencies
        delete pkg.bin

        if process.argv[3] is "--bin"
          pkg.snapshot = "lib/secret_sauce.bin"
          fs.copySync("./lib/secret_sauce.bin", distDir + "/lib/secret_sauce.bin")
        else
          fs.copySync("./lib/secret_sauce.coffee", distDir + "/src/lib/secret_sauce.coffee")

        fs.writeJsonSync(json, pkg, null, 2)

        resolve()

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

  uploadToS3: ->
    new Promise (resolve, reject) =>
      publisher = @getPublisher()
      options = @publisherOptions

      headers = {}
      headers["Cache-Control"] = "no-cache"

      version = @getVersion()

      gulp.src("./build/#{version}/#{@zip}")
        .pipe $.rename (p) ->
          p.dirname = version + "/"
          p
        .pipe publisher.publish(headers, options)
        .pipe $.awspublish.reporter()
        .on "error", reject
        .on "end", resolve

  createRemoteManifest: ->
    ## this isnt yet taking into account the os
    ## because we're only handling mac right now
    client = @getPublisher().client

    getUrl = (os) =>
      client.endpoint.href + [config.app.s3.bucket, @version, @zip].join("/")

    obj = {
      name: "cypress"
      version: @getVersion()
      packages: {
        mac: getUrl("mac")
        win: getUrl("win")
        linux: getUrl("linux")
      }
    }

    src = "./build/manifest.json"
    fs.outputJsonAsync(src, obj).return(src)

  updateS3Manifest: ->
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

  dist: (cb) ->
    log = (msg, color = "yellow") ->
      console.log gutil.colors[color](msg)

    Promise.bind(@)
      .then -> log("#prepare")
      .then(@prepare)
      .then -> log("#updatePackage")
      .then(@updatePackage)
      .then -> log("#setVersion")
      .then(@setVersion)
      .then -> log("#convertToJs")
      .then(@convertToJs)
      .then -> log("#obfuscate")
      .then(@obfuscate)
      .then -> log("#cleanupSrc")
      .then(@cleanupSrc)
      .then -> log("#npmInstall")
      # .then(@npmCopy)
      .then(@npmInstall)
      # .then(@runTests)
      .then -> log("#package")
      .then(@package)
      .then -> log("#cleanupDist")
      .then(@cleanupDist)
      .then -> log("#zipPackage")
      .then(@zipPackage)
      .then -> log("#uploadToS3")
      .then(@uploadToS3)
      .then -> log("#updateS3Manifest")
      .then(@updateS3Manifest)
      # .then(@cleanBuild)
      .then ->
        log("Dist Complete!", "green")
        cb?()
      .catch (err) ->
        log("Dist Failed!", "red")
        console.log err

module.exports = Deploy