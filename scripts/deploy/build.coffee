fs = require("fs-extra")
del = require("del")
path = require("path")
gulp = require("gulp")
chalk = require("chalk")
Promise = require("bluebird")
gulpDebug = require("gulp-debug")
gulpCoffee = require("gulp-coffee")
vinylPaths = require("vinyl-paths")
coffee = require("@packages/coffee")
electron = require("@packages/electron")
packages = require("./util/packages")

fs = Promise.promisifyAll(fs)

log = (msg, platform) ->
  console.log(chalk.yellow(msg), chalk.bgWhite(chalk.black(platform)))

module.exports = (platform, version) ->
  ## returns a path into the /dist directory
  distDir = (args...) ->
    path.resolve("dist", platform, args...)

  ## returns a path into the /build directory
  buildDir = (args...) ->
    path.resolve("build", platform, args...)

  ## returns a path into the /build/*/app directory
  ## specific to each platform
  buildAppDir = (args...) ->
    switch platform
      when "darwin"
        buildDir("Cypress.app", "Contents", "resources", "app", args...)
      when "linux"
        buildDir("Cypress", "resources", "app", args...)

  cleanupPlatform = ->
    log("#cleanupPlatform", platform)

    cleanup = =>
      fs.removeAsync(distDir())

    cleanup()
    .catch(cleanup)

  buildPackages = ->
    log("#buildPackages", platform)

    packages.runAllBuild()

  copyPackages = ->
    log("#copyPackages", platform)

    packages.copyAllToDist(distDir())

  npmInstallPackages = ->
    log("#npmInstallPackages", platform)

    packages.npmInstallAll(distDir("packages", "*"))

  createRootPackage = ->
    log("#createRootPackage", platform, version)

    fs.outputJsonAsync(distDir("package.json"), {
      name: "cypress"
      productName: "Cypress",
      version: version
      main: "index.js"
      scripts: {}
      env: "production"
    })
    .then =>
      str = "require('./packages/server')"

      fs.outputFileAsync(distDir("index.js"), str)

  symlinkBuildPackages = ->
    log("#symlinkBuildPackages", platform)

    packages.symlinkAll(buildAppDir)

  symlinkDistPackages = ->
    log("#symlinkDistPackages", platform)

    packages.symlinkAll(distDir)

  convertCoffeeToJs = ->
    log("#convertCoffeeToJs", platform)

    ## grab everything in src
    ## convert to js
    new Promise (resolve, reject) =>
      gulp.src([
        ## include coffee files of packages
        distDir("**", "*.coffee")

        ## except those in node_modules
        "!" + distDir("**", "node_modules", "**", "*.coffee")
      ])
      .pipe vinylPaths(del)
      .pipe(gulpDebug())
      .pipe gulpCoffee({
        coffee: coffee
      })
      .pipe gulp.dest(distDir())
      .on("end", resolve)
      .on("error", reject)


  elBuilder = ->
    log("#elBuilder", platform)

    electron.install({
      dir: distDir()
      dist: buildDir()
      platform: platform
      "app-version": version
    })

  Promise
  .bind(@)
  .then(cleanupPlatform)
  .then(buildPackages)
  .then(copyPackages)
  .then(npmInstallPackages)
  .then(createRootPackage)
  .then(symlinkDistPackages)
  .then(convertCoffeeToJs)
  # .then(@obfuscate)
  # .then(@cleanupSrc)
  # .then(@npmInstall)
  # .then(@npmInstall)
  .then(elBuilder)
  .then(symlinkBuildPackages)
  # .then(@runSmokeTest)
  # .then(@runProjectTest)
  # .then(@runFailingProjectTest)
  # .then(@cleanupCy)
  # .then(@codeSign) ## codesign after running smoke tests due to changing .cy
  # .then(@verifyAppCanOpen)
  # .return(@)
