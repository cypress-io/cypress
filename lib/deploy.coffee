config         = require("konfig")()
path           = require("path")
_              = require("lodash")
fs             = require("fs-extra")
Promise        = require("bluebird")
child_process  = require("child_process")
glob           = require("glob")
gulp           = require("gulp")
$              = require('gulp-load-plugins')()
gutil          = require("gulp-util")
inquirer       = require("inquirer")
NwBuilder      = require("node-webkit-builder")
request        = require("request-promise")
os             = require("os")
vagrant        = require("vagrant")
runSequence    = require("run-sequence")

vagrant.debug = true

fs = Promise.promisifyAll(fs)

require path.join(process.cwd(), "gulpfile.coffee")

distDir   = path.join(process.cwd(), "dist")
buildDir  = path.join(process.cwd(), "build")
platforms = ["osx64", "linux64"]

class Platform
  constructor: (@platform, @options = {}) ->
    _.defaults @options,
      runTests:         true
      version:          null
      publisher:        null
      publisherOptions: {}
      zip:              "cypress.zip"

    # @version          = null
    # @publisher        = null
    # @publisherOptions = {}
    # @zip              = "cypress.zip"

  getVersion: ->
    @options.version ?
      fs.readJsonSync("./package.json").version ?
          throw new Error("Platform#version was not defined!")

  getPublisher: ->
    aws = fs.readJsonSync("./support/aws-credentials.json")

    @publisher ?= $.awspublish.create
      bucket:          config.app.s3.bucket
      accessKeyId:     aws.key
      secretAccessKey: aws.secret

  copyFiles: ->
    @log("#copyFiles")

    copy = (src, dest) =>
      dest ?= src
      dest = @distDir(dest.slice(1))

      fs.copyAsync(src, dest)

    fs
      .removeAsync(@distDir())
      .bind(@)
      .then ->
        fs.ensureDirAsync(@distDir())
      .then ->
        [
          ## copy root files
          copy("./package.json")
          copy("./config/app.yml")
          copy("./lib/html")
          copy("./lib/public")
          copy("./lib/scaffold")
          copy("./nw/public")
          copy("./lib/secret_sauce.bin")

          ## copy coffee src files
          copy("./lib/cypress.coffee",      "/src/lib/cypress.coffee")
          copy("./lib/controllers",         "/src/lib/controllers")
          copy("./lib/util",                "/src/lib/util")
          copy("./lib/routes",              "/src/lib/routes")
          copy("./lib/sauce",               "/src/lib/sauce")
          copy("./lib/cache.coffee",        "/src/lib/cache.coffee")
          copy("./lib/id_generator.coffee", "/src/lib/id_generator.coffee")
          copy("./lib/keys.coffee",         "/src/lib/keys.coffee")
          copy("./lib/logger.coffee",       "/src/lib/logger.coffee")
          copy("./lib/project.coffee",      "/src/lib/project.coffee")
          copy("./lib/server.coffee",       "/src/lib/server.coffee")
          copy("./lib/socket.coffee",       "/src/lib/socket.coffee")
          copy("./lib/support.coffee",      "/src/lib/support.coffee")
          copy("./lib/fixtures.coffee",     "/src/lib/fixtures.coffee")
          copy("./lib/updater.coffee",      "/src/lib/updater.coffee")
          copy("./lib/environment.coffee",  "/src/lib/environment.coffee")
          copy("./lib/log.coffee",          "/src/lib/log.coffee")
          copy("./lib/exception.coffee",    "/src/lib/exception.coffee")
          copy("./lib/chromium.coffee",     "/src/lib/chromium.coffee")

          ## copy nw_spec files
          copy("./spec")

          ## copy bower components for testing
          copy("./bower_components")

        ]
      .all()

  convertToJs: ->
    @log("#convertToJs")

    ## grab everything in src
    ## convert to js
    new Promise (resolve, reject) =>
      gulp.src(@distDir("src/**/*.coffee"))
        .pipe $.coffee()
        .pipe gulp.dest(@distDir("src"))
        .on "end", resolve
        .on "error", reject

  distDir: (src) ->
    args = _.compact [distDir, @platform, src]
    path.join args...

  obfuscate: ->
    @log("#obfuscate")

    ## obfuscate all the js files
    new Promise (resolve, reject) =>
      ## grab all of the js files
      files = glob.sync @distDir("src/**/*.js")

      ## root is src
      ## entry is cypress.js
      ## files are all the js files
      opts = {root: @distDir("src"), entry: @distDir("src/lib/cypress.js"), files: files}

      obfuscator = require('obfuscator').obfuscator
      obfuscator opts, (err, obfuscated) =>
        return reject(err) if err

        ## move to lib
        fs.writeFileSync(@distDir("lib/cypress.js"), obfuscated)

        resolve(obfuscated)

  cleanupSpec: ->
    @log("#cleanupSpec")

    fs.removeAsync @distDir("/spec")

  cleanupSrc: ->
    @log("#cleanupSrc")

    fs.removeAsync @distDir("/src")

  cleanupBc: ->
    @log("#cleanupBc")

    fs.removeAsync @distDir("/bower_components")

  cleanupPlatform: ->
    @log("#cleanupPlatform")

    fs.removeAsync path.join(buildDir, @platform)

  runTests: ->
    if @options.runTests is false
      return Promise.resolve()

    Promise.bind(@).then(@nwTests)

  nwTests: ->
    @log("#nwTests")

    new Promise (resolve, reject) =>
      retries = 0

      nwTests = =>
        retries += 1

        tests = "../../node_modules/.bin/nw ./spec/nw_unit --headless"# --index=#{indexPath}"
        child_process.exec tests, {cwd: @distDir()}, (err, stdout, stderr) =>
        # child_process.spawn "../../node_modules/.bin/nw", ["./spec/nw_unit", "--headless"], {cwd: @distDir(), stdio: "inherit"}, (err, stdout, stderr) ->
          console.log "err", err
          console.log "stdout", stdout
          console.log "stderr", stderr

          retry = (failures) ->
            if retries is 5
              if failures instanceof Error
                err = failures
              else
                err = new Error("Mocha failed with '#{failures}' failures")
              return reject(err)

            console.log gutil.colors.red("'nwTests' failed, retrying")
            nwTests()

          results = @distDir("spec/results.json")

          fs.readJsonAsync(results)
            .then (failures) ->
              if failures is 0
                fs.removeSync(results)

                console.log gutil.colors.green("'nwTests' passed with #{failures} failures")
                resolve()
              else
                retry(failures)
            .catch(retry)

      nwTests()

  ## add tests around this method
  updatePackage: ->
    @log("#updatePackage")

    version = @options.version

    fs.readJsonAsync(@distDir("package.json")).then (json) =>
      json.env = "production"
      json.version = version if version
      json.scripts = {}

      delete json.devDependencies
      delete json.bin

      fs.writeJsonAsync(@distDir("package.json"), json)

  npmInstall: ->
    @log("#npmInstall")

    new Promise (resolve, reject) =>
      attempts = 0

      # pathToPackageDir = _.once =>
        ## return the path to the directory containing the package.json
        # packages = glob.sync(@distDir("package.json"), {nodir: true})
        # path.dirname(packages[0])

      npmInstall = =>
        attempts += 1

        child_process.exec "npm install --production", {cwd: @distDir()}, (err, stdout, stderr) ->
          if err
            if attempts is 3
              fs.writeFileSync("./npm-install.log", stderr)
              return reject(err)

            console.log gutil.colors.red("'npm install' failed, retrying")
            return npmInstall()

          ## promise-semaphore has a weird '/'' file which causes zipping to bomb
          ## so we must remove that file!
          # fs.removeSync(pathToPackageDir() + "/node_modules/promise-semaphore/\\")

          resolve()

      npmInstall()

  nwBuilder: ->
    @log("#nwBuilder")

    nw = new NwBuilder
      files: @distDir("/**/*")
      platforms: [@platform]
      buildDir: buildDir
      version: "0.12.2"
      buildType: => @getVersion()
      macIcns: "nw/public/img/cypress.icns"
      # macZip: true

    nw.on "log", console.log

    nw.build()

  getUploadDirName: (version, platform, override) ->
    (override or (version + "/" + platform)) + "/"

  uploadToS3: (platform, override) ->
    @log("#uploadToS3: #{platform}")

    new Promise (resolve, reject) =>

      publisher = @getPublisher()
      options = @publisherOptions

      headers = {}
      headers["Cache-Control"] = "no-cache"

      version = @getVersion()

      gulp.src("#{buildDir}/#{version}/#{platform}/#{@zip}")
        .pipe $.rename (p) =>
          p.dirname = @getUploadDirName(version, platform, override)
          p
        .pipe publisher.publish(headers, options)
        .pipe $.awspublish.reporter()
        .on "error", reject
        .on "end", resolve

  uploadsToS3: (dirname) ->
    @log("#uploadsToS3")

    uploadToS3 = _.partialRight(@uploadToS3, dirname)

    Promise.all _.map(@platforms, _.bind(uploadToS3, @))

  uploadFixtureToS3: ->
    @log("#uploadFixtureToS3")

    @uploadToS3("osx64", "fixture")

  createRemoteManifest: ->
    ## this isnt yet taking into account the os
    ## because we're only handling mac right now
    getUrl = (os) =>
      {
        url: [config.app.s3.path, config.app.s3.bucket, @version, os, @zip].join("/")
      }

    obj = {
      name: "cypress"
      version: @getVersion()
      packages: {
        mac: getUrl("osx64")
        win: getUrl("win64")
        linux64: getUrl("linux64")
      }
    }

    src = "#{buildDir}/manifest.json"
    fs.outputJsonAsync(src, obj).return(src)

  getManifest: ->
    url = [config.app.s3.path, config.app.s3.bucket, "manifest.json"].join("/")
    request(url).then (resp) ->
      console.log resp

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

  cleanupDist: ->
    @log("#cleanupDist")

    fs.removeAsync(@distDir())

  build: ->
    Promise.bind(@)
      .then(@cleanupPlatform)
      .then(@gulpBuild)
      .then(@copyFiles)
      .then(@updatePackage)
      .then(@convertToJs)
      .then(@obfuscate)
      .then(@cleanupSrc)
      .then(@npmInstall)

  dist: ->
    Promise.bind(@)
      .then(@build)
      .then(@runTests)
      .then(@cleanupSpec)
      .then(@cleanupBc)
      .then(@nwBuilder)
      .then(@codeSign)
      .then(@cleanupDist)
      .then(@runSmokeTest)
      # .then(@zip)
      # .then(@runZippedSmokeTest)

  fixture: (cb) ->
    @dist()
      .then(@uploadFixtureToS3)
      .then(@cleanupPlatform)
      .then ->
        @log("Fixture Complete!", "green")
        cb?()
      .catch (err) ->
        @log("Fixture Failed!", "red")
        console.log err

  log: (msg, color = "yellow") ->
    return if process.env["NODE_ENV"] is "test"
    console.log gutil.colors[color](msg), gutil.colors.bgWhite(gutil.colors.black(@platform))

  manifest: ->
    Promise.bind(@)
      .then(@copyFiles)
      .then(@setVersion)
      .then(@updateS3Manifest)
      .then(@cleanupDist)

  gulpBuild: ->
    @log "gulpBuild"

    new Promise (resolve, reject) ->
      runSequence ["client:build", "nw:build"], (err) ->
        if err then reject(err) else resolve()

  # deploy: ->
    # @dist()
    # @distEachVersion()
      # .then(@uploadsToS3)
      # .then(@updateS3Manifest)
      # .then(@cleanupPlatform)
      # .then ->
      #   @log("Dist Complete!", "green")
      #   cb?()
      # .catch (err) ->
      #   @log("Dist Failed!", "red")
      #   console.log err

class Osx64 extends Platform
  runSmokeTest: ->
    @log("#runSmokeTest")

    appPath = path.join buildDir, @getVersion(), @platform, "cypress.app", "Contents", "MacOS", "nwjs"

    new Promise (resolve, reject) ->
      rand = "" + Math.random()

      child_process.exec "#{appPath} --smoke-test --ping=#{rand}", {stdio: "inherit"}, (err, stdout, stderr) ->
        stdout = stdout.replace(/\s/, "")

        return reject(err) if err

        if stdout isnt rand
          reject("Stdout: '#{stdout}' did not match the random number: '#{rand}'")
        else
          resolve()

  codeSign: ->
    @log("#codeSign")

    appPath = path.join buildDir, @getVersion(), @platform, "cypress.app"

    new Promise (resolve, reject) ->
      child_process.exec "sh ./support/codesign.sh #{appPath}", (err, stdout, stderr) ->
        return reject(err) if err

        # console.log "stdout is", stdout

        resolve()

  deploy: ->
    @dist()

class Linux64 extends Platform
  codeSign: ->
    Promise.resolve()

  deploy: ->
    new Promise (resolve, reject) =>
      ssh = ->
        vagrant.ssh ["-c", "cd /vagrant && gulp dist --skip-tests"], (code) ->
          if code isnt 0
            reject("vagrant.ssh gulp dist failed!")
          else
            resolve()

      vagrant.status (code) ->
        if code isnt 0
          vagrant.up (code) ->
            reject("vagrant.up failed!") if code isnt 0
            ssh()
        else
          ssh()

module.exports = {
  Platform: Platform
  Osx64: Osx64
  Linux64: Linux64

  getQuestions: (version) ->
    [{
      name: "publish"
      type: "list"
      message: "Publish a new version? (currently: #{version})"
      choices: [{
        name: "Yes: set a new version and update remote manifest."
        value: true
      },{
        name: "No:  just override the current deploy’ed version."
        value: false
      }]
    },{
      name: "version"
      type: "input"
      message: "Bump version to...? (currently: #{version})"
      default: ->
        a = version.split(".")
        v = a[a.length - 1]
        v = Number(v) + 1
        a.splice(a.length - 1, 1, v)
        a.join(".")
      when: (answers) ->
        answers.publish
    }]

  updateLocalPackageJson: (version, json) ->
    json ?= fs.readJsonSync("./package.json")
    json.version = version
    fs.writeJsonAsync("./package.json", json)

  askDeployNewVersion: ->
    new Promise (resolve, reject) =>
      fs.readJsonAsync("./package.json").then (json) =>
        inquirer.prompt @getQuestions(json.version), (answers) =>
          ## set the new version if we're publishing!
          ## update our own local package.json as well
          if answers.publish
            @updateLocalPackageJson(answers.version, json).then ->
              resolve(answers.version)
          else
            resolve(json.version)

  getPlatformsQuestion: ->
    [{
      name: "platforms"
      type: "checkbox"
      message: "Which OS's should we deploy?"
      choices: [{
        name: "Mac"
        value: "osx64"
        checked: true
      },{
        name: "Linux"
        value: "linux64"
        checked: true
      }]
    }]

  askWhichPlatforms: ->
    new Promise (resolve, reject) =>
      inquirer.prompt @getPlatformsQuestion(), (answers) =>
        resolve(answers.platforms)

  updateS3Manifest: ->

  cleanupEachPlatform: (platforms) ->
    Promise
      .map(platforms, @cleanupPlatform)
      .bind(@)

  deployPlatform: (platform, options) ->
    @getPlatform(platform, options).deploy()

  getPlatform: (platform, options) ->
    platform ?= @platform()

    Platform = @[platform.slice(0, 1).toUpperCase() + platform.slice(1)]

    throw new Error("Platform: '#{platform}' not found") if not Platform

    options ?= @parseOptions(process.argv)

    (new Platform(platform, options))

  zip: (platform, options) ->
    root = "#{buildDir}/#{options.version}/#{platform}"

    new Promise (resolve, reject) =>
      zip = "ditto -c -k --sequesterRsrc --keepParent #{root}/cypress.app #{root}/#{options.zip}"
      child_process.exec zip, {}, (err, stdout, stderr) ->
        return reject(err) if err

        resolve()

  zipEachPlatform: (platforms, options) ->
    Promise
      .resolve(platforms)
      .bind(@)
      .map (platform) ->
        @zip(platform, options)

  deployEachPlatform: (platforms, options) ->
    Promise
      .resolve(platforms)
      .bind(@)
      .map (platform) ->
        @deployPlatform(platform, options)

  parseOptions: (argv) ->
    opts = {}
    opts.runTests = false if "--skip-tests" in argv
    opts

  platform: ->
    {
      darwin: "osx64"
      linux:  "linux64"
    }[os.platform()] or throw new Error("OS Platform: '#{os.platform()}' not supported!")

  cleanupDist: ->
    # @log("#cleanupDist")

    fs.removeAsync(distDir)

  runTests: ->
    @getPlatform().runTests()

  runSmokeTest: ->
    @getPlatform().runSmokeTest()

  build: ->
    @getPlatform().build()

  dist: ->
    @cleanupDist().then =>
      @getPlatform(null).dist()

  deploy: (platform) ->
    ## read off the argv?
    options = @parseOptions(process.argv)

    deploy = (platforms) =>
      @askDeployNewVersion()
        .then (version) =>
          options.version = version
          @deployEachPlatform(platforms, options)
          .then =>
            @zipEachPlatform(platforms, options)
        # .then(@uploadsToS3)
        # .then(@updateS3Manifest)
        # .then(@cleanupEachPlatform)
        # .then ->
        #   console.log("Dist Complete")
        # .catch (err) ->
        #   console.log("Dist Failed")
        #   console.log(err)

    if platform
      return deploy(platform)

    @askWhichPlatforms().bind(@).then(deploy)
}