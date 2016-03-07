require("../gulpfile.coffee")

_            = require("lodash")
$            = require("gulp-load-plugins")()
fs           = require("fs-extra")
cp           = require("child_process")
path         = require("path")
gulp         = require("gulp")
glob         = require("glob")
pkgr         = require("electron-packager")
expect       = require("chai").expect
Promise      = require("bluebird")
obfuscator   = require("obfuscator")
runSequence  = require("run-sequence")
cypressIcons = require("cypress-icons")
log          = require("./log")
meta         = require("./meta")
pkg          = require("../package.json")
Fixtures     = require("../spec/server/helpers/fixtures")

pkgr     = Promise.promisify(pkgr)
fs       = Promise.promisifyAll(fs)
zipName  = "cypress.zip"

class Base
  constructor: (os, @options = {}) ->
    _.defaults @options,
    #   runTests:         true
      version:          null
    #   publisher:        null
    #   publisherOptions: {}
      # platform:         platform

    @zipName      = zipName
    @osName       = os
    @uploadName   = @getUploadNameByOs(os)

  buildPathToAppFolder: ->
    path.join meta.buildDir, @osName

  getUploadNameByOs: (os) ->
    {
      darwin: "osx64"
      linux:  "linux64"
      win32:  "win64"
    }[os]

  getVersion: ->
    @options.version ? fs.readJsonSync(@distDir("package.json")).version

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
          copy("./lib/ipc")

          ## copy entry point
          copy("./index.js", "/src/index.js")

          ## copy coffee src files
          copy("./lib/controllers",         "/src/lib/controllers")
          copy("./lib/electron",            "/src/lib/electron")
          copy("./lib/modes",               "/src/lib/modes")
          copy("./lib/util",                "/src/lib/util")
          copy("./lib/api.coffee",          "/src/lib/api.coffee")
          copy("./lib/cache.coffee",        "/src/lib/cache.coffee")
          copy("./lib/config.coffee",       "/src/lib/config.coffee")
          copy("./lib/cwd.coffee",          "/src/lib/cwd.coffee")
          copy("./lib/cypress.coffee",      "/src/lib/cypress.coffee")
          copy("./lib/environment.coffee",  "/src/lib/environment.coffee")
          copy("./lib/errors.coffee",       "/src/lib/errors.coffee")
          copy("./lib/exception.coffee",    "/src/lib/exception.coffee")
          copy("./lib/fixture.coffee",      "/src/lib/fixture.coffee")
          copy("./lib/ids.coffee",          "/src/lib/ids.coffee")
          copy("./lib/logger.coffee",       "/src/lib/logger.coffee")
          copy("./lib/project.coffee",      "/src/lib/project.coffee")
          copy("./lib/reporter.coffee",     "/src/lib/reporter.coffee")
          copy("./lib/request.coffee",      "/src/lib/request.coffee")
          copy("./lib/routes.coffee",       "/src/lib/routes.coffee")
          copy("./lib/server.coffee",       "/src/lib/server.coffee")
          copy("./lib/socket.coffee",       "/src/lib/socket.coffee")
          copy("./lib/support.coffee",      "/src/lib/support.coffee")
          copy("./lib/updater.coffee",      "/src/lib/updater.coffee")
          copy("./lib/user.coffee",         "/src/lib/user.coffee")
          copy("./lib/watchers.coffee",     "/src/lib/watchers.coffee")

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
    args = _.compact [meta.distDir, @osName, src]
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
      opts = {root: @distDir("src"), entry: @distDir("src/index.js"), files: files}

      obfuscator.concatenate opts, (err, obfuscated) =>
        return reject(err) if err

        ## move to lib
        fs.writeFileSync(@distDir("index.js"), obfuscated)

        resolve(obfuscated)

  cleanupSrc: ->
    @log("#cleanupSrc")

    fs.removeAsync @distDir("/src")

  cleanupPlatform: ->
    @log("#cleanupPlatform")

    fs.removeAsync path.join(meta.buildDir, @osName)

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

      npmInstall = =>
        attempts += 1

        cp.exec "npm install --production", {cwd: @distDir()}, (err, stdout, stderr) ->
          if err
            if attempts is 3
              fs.writeFileSync("./npm-install.log", stderr)
              return reject(err)

            console.log gutil.colors.red("'npm install' failed, retrying")
            return npmInstall()

          resolve()

      npmInstall()

  elBuilder: ->
    @log("#elBuilder")

    fs.readJsonAsync(@distDir("package.json"))
    .then (json) =>
      pkgr({
        dir: @distDir()
        out: meta.buildDir
        name: "Cypress"
        platform: @osName
        arch: "x64"
        asar: false
        prune: true
        overwrite: true
        version: pkg.devDependencies["electron-prebuilt"]
        icon: cypressIcons.getPathToIcon("cypress.icns")
        "app-version": json.version
      })

  renameBuild: (pathToBuilds = []) ->
    @log("#renameBuild")

    src = pathToBuilds[0]

    ## grab the platform between 'Cypress-darwin-x64'
    platform = path.basename(src).split("-").slice(1, 2).join("")
    dest     = @getBuildDest(src, platform)

    fs.ensureDirAsync(dest).then ->
      fs.moveAsync(src, dest, {clobber: true}).return(dest)

  uploadFixtureToS3: ->
    @log("#uploadFixtureToS3")

    @uploadToS3("osx64", "fixture")

  getManifest: ->
    requestPromise(config.app.desktop_manifest_url).then (resp) ->
      console.log resp

  cleanupDist: ->
    @log("#cleanupDist")

    fs.removeAsync(@distDir())

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

  log: ->
    log.apply(@, arguments)

  manifest: ->
    Promise.bind(@)
      .then(@copyFiles)
      .then(@setVersion)
      .then(@updateS3Manifest)
      .then(@cleanupDist)

  gulpBuild: ->
    @log "gulpBuild"

    new Promise (resolve, reject) ->
      runSequence "client:build", "client:minify", (err) ->
        if err then reject(err) else resolve()

  createCyCache: (todosProject) ->
    cache = path.join(@buildPathToAppResources(), ".cy", "production", "cache")

    fs.outputJsonAsync(cache, {
      USER: {session_token: "abc123"}
      PROJECTS: {
        ## hard code the todos project id for now
        "e3e58d3f-3769-4b50-af38-e31b8989a938": {
          PATH: todosProject
        }
      }
    })

  removeCyCache: ->
    ## empty the .cy/production folder
    cache = path.join(@buildPathToAppResources(), ".cy", "production")

    fs.emptyDirAsync(cache)

  _runProjectTest: ->
    @log("#runProjectTest")

    Fixtures.scaffold()

    todos = Fixtures.projectPath("todos")

    runProjectTest = =>
      new Promise (resolve, reject) =>
        sp = cp.spawn @buildPathToAppExecutable(), ["--run-project=#{todos}"], {stdio: "inherit"}
        sp.on "exit", (code) ->
          Fixtures.remove()

          if code is 0
            resolve()
          else
            reject(new Error("running project tests failed with: '#{code}' errors."))

    @createCyCache(todos)
    .then(runProjectTest)
    .then =>
      @removeCyCache()

  _runSmokeTest: ->
    @log("#runSmokeTest")

    smokeTest = =>
      new Promise (resolve, reject) =>
        rand = "" + Math.random()

        cp.exec "#{@buildPathToAppExecutable()} --smoke-test --ping=#{rand}", (err, stdout, stderr) ->
          stdout = stdout.replace(/\s/, "")

          return reject(err) if err

          if stdout isnt rand
            throw new Error("Stdout: '#{stdout}' did not match the random number: '#{rand}'")
          else
            resolve()

    verifyAppPackage = =>
      new Promise (resolve, reject) =>
        cp.exec "#{@buildPathToAppExecutable()} --return-pkg", (err, stdout, stderr) ->
          return reject(err) if err

          stdout = JSON.parse(stdout)

          try
            expect(stdout.env).to.eq("production")
          catch err
            console.log(stdout)
            return reject(err)

          resolve()

    smokeTest().then(verifyAppPackage)

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
    .then(@npmInstall)
    .then(@elBuilder)
    .then(@renameBuild)
    .then(@afterBuild)
    .then(@runSmokeTest)
    .then(@runProjectTest)
    .then(@codeSign) ## codesign after running smoke tests due to changing .cy
    .then(@verifyAppCanOpen)

  dist: ->
    Promise.bind(@)
    # .then(@build)
    # .then(@cleanupDist)

module.exports = Base