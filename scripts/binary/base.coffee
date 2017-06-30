_            = require("lodash")
gulpCoffee   = require("gulp-coffee")
fs           = require("fs-extra")
cp           = require("child_process")
path         = require("path")
gulp         = require("gulp")
glob         = require("glob")
chalk        = require("chalk")
expect       = require("chai").expect
Promise      = require("bluebird")
obfuscator   = require("obfuscator")
# runSequence  = require("run-sequence")
cypressElectron = require("@packages/electron")
log          = require("./log")
meta         = require("./meta")

root         = "../.."
pkg          = require(path.join(root, "package.json"))
fromPackages = _.partial(path.join, root, "packages")
konfig       = require(fromPackages("server/lib/konfig"))
appData      = require(fromPackages("server/lib/util/app_data"))
Fixtures     = require(fromPackages("server/test/support/helpers/fixtures"))

# pkgr     = Promise.promisify(pkgr)
fs       = Promise.promisifyAll(fs)
glob     = Promise.promisify(glob)
zipName  = "cypress.zip"

DEFAULT_PATHS = "node_modules package.json".split(" ")

pathToPackageJson = (pkg) ->
  path.join(pkg, "package.json")

class Base
  constructor: (os, @options = {}) ->
    _.defaults @options, {
      version: null
    }

    @zipName      = zipName
    @osName       = os
    @uploadOsName = @getUploadNameByOs(os)

  buildPathToAppFolder: ->
    meta.buildDir(@osName)

  buildPathToZip: ->
    path.join @buildPathToAppFolder(), @zipName

  getUploadNameByOs: (os) ->
    {
      darwin: "osx64"
      linux:  "linux64"
      win32:  "win64"
    }[os]

  getVersion: ->
    @options.version ? fs.readJsonSync(@distDir("package.json")).version

  copyPackages: ->
    @log("#copyPackages")

    dist = @distDir()

    copy = (src, dest) =>
      dest ?= src
      dest = @distDir(dest.slice(1))

      fs.copyAsync(src, dest)

    copyRelativePathToDist = (relative) ->
      dest = path.join(dist, relative)

      console.log(relative, "->", dest)

      # copy = ->
      #   new Promise (resolve, reject) ->
      #     cp.spawn("cp", ["-R", relative, dest], {stdio: "inherit"})
      #     .on "error", reject
      #     .on "exit", resolve

      # if relative.includes(".")
      #   copy()
      # else
      #   fs.ensureDirAsync(dest)
      #   .then(copy)

      fs.copyAsync(relative, dest)

    copyPackage = (pkg) ->
      ## copies the package to dist
      ## including the default paths
      ## and any specified in package.json files
      fs.readJsonAsync(pathToPackageJson(pkg))
      .then (json) ->
        ## grab all the files
        ## and default included paths
        ## and convert to relative paths
        DEFAULT_PATHS
        .concat(json.files or [])
        .map (file) ->
          path.join(pkg, file)
      .map(copyRelativePathToDist, {concurrency: 1})

    ## fs-extra concurrency tests (copyPackage / copyRelativePathToDist)
    ## 1/1  41688
    ## 1/5  42218
    ## 1/10 42566
    ## 2/1  45041
    ## 2/2  43589
    ## 3/3  51399

    ## cp -R concurrency tests
    ## 1/1 65811

    started = new Date()

    fs
      .removeAsync(dist)
      .bind(@)
      .then ->
        fs.ensureDirAsync(dist)
      .then ->
        glob("./packages/*")
        .map(copyPackage, {concurrency: 1})
      .then ->
        console.log("Finished Copying", new Date() - started)

  prunePackages: ->
    pathToDistPackages = @distDir("packages", "*")

    ## 1,060,495,784 bytes (1.54 GB on disk) for 179,156 items
    ## 313,416,512 bytes (376.6 MB on disk) for 23,576 items

    prune = (pkg) ->
      console.log("prune", pkg)

      new Promise (resolve, reject) ->
        cp.spawn("npm", ["prune", "--production"], {
          cwd: pkg
          stdio: "inherit"
        })
        .on("error", reject)
        .on("exit", (code) ->
          if code is 0
            resolve()
          else
            reject(new Error("'npm prune --production' on #{pkg} failed with exit code: #{code}"))
        )

    ## prunes out all of the devDependencies
    ## from what was copied
    glob(pathToDistPackages)
    .map(prune)

  convertCoffeeToJs: ->
    @log("#convertCoffeeToJs")

    ## grab everything in src
    ## convert to js
    new Promise (resolve, reject) =>
      gulp.src(@distDir("lib", "**", "*.coffee"))
        .pipe gulpCoffee()
        .pipe gulp.dest(@distDir("lib"))
        .on("end", resolve)
        .on("error", reject)

  distDir: (args...) ->
    args = _.compact [meta.distDir, @osName, args...]
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

    cleanup = =>
      Promise.all([
        fs.removeAsync path.join(meta.distDir, @osName)
        fs.removeAsync path.join(meta.buildDir, @osName)
      ])

    cleanup().catch(cleanup)

  symlinkPackages: ->
    @log("#symlinkPackages")

    dist = @distDir()
    pathToPackages = path.join('node_modules', '@')
    pathToDistPackages = @distDir("packages", "*")

    symlink = (pkg) ->
      # console.log(pkg, dist)
      ## strip off the initial './'
      ## ./packages/foo -> node_modules/@packages/foo
      dest = path.join(dist, "node_modules", "@packages", path.basename(pkg))

      fs.ensureSymlinkAsync(pkg, dest)

    glob(pathToDistPackages)
    .map(symlink)

    # // glob all of the names of packages
    # glob('./packages/*')
    # .map((folder) => {
    #   // strip off the initial './'
    #   // ./packages/foo -> node_modules/@packages/foo
    #   const dest = pathToPackages + folder.slice(2)
    #
    #   console.log('symlinking', folder, '->', dest)
    #
    #   return fs.ensureSymlinkAsync(folder, dest)
    # })

  ## add tests around this method
  createRootPackage: ->
    version = @options.version

    @log("#createRootPackage #{version}")

    fs.outputJsonAsync(@distDir("package.json"), {
      name: "cypress"
      productName: "Cypress",
      version: version
      main: "index.js"
      scripts: {}
      env: "production"
    })
    .then =>
      str = "require('./packages/server')"

      fs.outputFileAsync(@distDir("index.js"), str)

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

            console.log chalk.red("'npm install' failed, retrying")
            return npmInstall()

          resolve()

      npmInstall()

  elBuilder: ->
    @log("#elBuilder")

    fs.readJsonAsync(@distDir("package.json"))
    .then (json) =>
      cypressElectron.install({
        dir: @distDir()
        dist: @buildPathForElectron()
        platform: @osName
        "app-version": json.version
      })

  uploadFixtureToS3: ->
    @log("#uploadFixtureToS3")

    @uploadToS3("osx64", "fixture")

  getManifest: ->
    requestPromise(konfig("desktop_manifest_url")).then (resp) ->
      console.log resp

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

  buildPackages: ->
    @log("#buildPackages")

    new Promise (resolve, reject) ->
      console.log(process.cwd())

      ## build all the packages except for
      ## cli and docs
      cp.spawn("npm", ["run", "all", "build", "--", "--skip-packages", "cli,docs"], { stdio: "inherit" })
      .on "error", reject
      .on "exit", (code) ->
        if code is 0
          resolve()
        else
          reject(new Error("'npm run build' failed with exit code: #{code}"))

  _runProjectTest: ->
    @log("#runProjectTest")

    Fixtures.scaffold()

    e2e = Fixtures.projectPath("e2e")

    runProjectTest = =>
      new Promise (resolve, reject) =>
        env = _.omit(process.env, "CYPRESS_ENV")

        sp = cp.spawn @buildPathToAppExecutable(), ["--run-project=#{e2e}", "--spec=cypress/integration/simple_passing_spec.coffee"], {stdio: "inherit", env: env}
        sp.on "exit", (code) ->
          if code is 0
            resolve()
          else
            reject(new Error("running project tests failed with: '#{code}' errors."))

    runProjectTest()
    .then ->
      Fixtures.remove()

  _runFailingProjectTest: ->
    @log("#runFailingProjectTest")

    Fixtures.scaffold()

    e2e = Fixtures.projectPath("e2e")

    verifyScreenshots = =>
      screenshot1 = path.join(e2e, "cypress", "screenshots", "simple failing spec -- fails1.png")
      screenshot2 = path.join(e2e, "cypress", "screenshots", "simple failing spec -- fails2.png")

      Promise.all([
        fs.statAsync(screenshot1)
        fs.statAsync(screenshot2)
      ])

    runProjectTest = =>
      new Promise (resolve, reject) =>
        env = _.omit(process.env, "CYPRESS_ENV")

        sp = cp.spawn @buildPathToAppExecutable(), ["--run-project=#{e2e}", "--spec=cypress/integration/simple_failing_spec.coffee"], {stdio: "inherit", env: env}
        sp.on "exit", (code) ->
          if code is 2
            resolve()
          else
            reject(new Error("running project tests failed with: '#{code}' errors."))

    runProjectTest()
    .then(verifyScreenshots)
    .then ->
      Fixtures.remove()

  _runSmokeTest: ->
    @log("#runSmokeTest")

    smokeTest = =>
      new Promise (resolve, reject) =>
        rand = "" + Math.random()
        executable = @buildPathToAppExecutable()
        console.log("executable path #{executable}")

        cp.exec "#{executable} --smoke-test --ping=#{rand}", (err, stdout, stderr) ->
          stdout = stdout.replace(/\s/, "")

          if err
            console.error("smoke test failed with error %s", err.message)
            return reject(err)

          if stdout isnt rand
            throw new Error("Stdout: '#{stdout}' did not match the random number: '#{rand}'")
          else
            console.log("smokeTest passes")
            resolve()

    verifyAppPackage = =>
      new Promise (resolve, reject) =>
        console.log("verifyAppPackage")
        cp.exec "#{@buildPathToAppExecutable()} --return-pkg", (err, stdout, stderr) ->
          return reject(err) if err

          stdout = JSON.parse(stdout)

          try
            expect(stdout.env).to.eq("production")
          catch err
            console.error("failed to verify app via --return-pkg")
            console.log(stdout)
            return reject(err)

          console.log("app verified")
          resolve()

    smokeTest()
    # TODO refactor verifying app package
    # .then(verifyAppPackage)

  cleanupCy: ->
    appData.removeSymlink()

  build: ->
    Promise
    .bind(@)
    # .then(@cleanupPlatform)
    # .then(@buildPackages)
    # .then(@copyPackages)
    # .then(@prunePackages)
    .then(@createRootPackage)
    .then(@symlinkPackages)
    # .then(@convertCoffeeToJs)
    # .then(@obfuscate)
    # .then(@cleanupSrc)
    # .then(@npmInstall)
    # .then(@npmInstall)
    # .then(@elBuilder)
    # .then(@runSmokeTest)
    # .then(@runProjectTest)
    # .then(@runFailingProjectTest)
    # .then(@cleanupCy)
    # .then(@codeSign) ## codesign after running smoke tests due to changing .cy
    # .then(@verifyAppCanOpen)
    .return(@)

module.exports = Base
