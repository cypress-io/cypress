fs = require("fs-extra")
del = require("del")
path = require("path")
gulp = require("gulp")
chalk = require("chalk")
Promise = require("bluebird")
gulpDebug = require("gulp-debug")
gulpCoffee = require("gulp-coffee")
gulpTypeScript = require("gulp-typescript")
vinylPaths = require("vinyl-paths")
coffee = require("@packages/coffee")
packages = require("./util/packages")
pluralize = require("pluralize")

fs = Promise.promisifyAll(fs)

log = (msg, platform) ->
  console.log(chalk.yellow(msg), chalk.bgWhite(chalk.black(platform)))

module.exports = (platform, version) ->
  distDir = (args...) ->
    path.resolve("dist", platform, args...)

  cleanupPlatform = ->
    log("#cleanupPlatform", platform)

    cleanup = =>
      fs.removeAsync(distDir())

    cleanup()
    .catch(cleanup)

  buildPackages = ->
    log("#buildPackages", platform)

    packages.runAllBuild()
    .then(packages.runAllBuildJs)

  copyPackages = ->
    log("#copyPackages", platform)
    destination = distDir()

    packages.copyAllToDist(destination)

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

  symlinkPackages = ->
    log("#symlinkPackages", platform)

    packages.symlinkAll(distDir)

  removeTypeScript = ->
    ## remove the .ts files in our packages
    log("#removeTypeScript", platform)
    del([
      ## include coffee files of packages
      distDir("**", "*.ts")

      ## except those in node_modules
      "!" + distDir("**", "node_modules", "**", "*.ts")
    ])
    .then((paths) ->
      console.log("deleted %d TS %s",
        paths.length, pluralize("file", paths.length))
      console.log(paths)
    )

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

  log("#distDir", "building into folder #{distDir()}")
  Promise
  .bind(@)
  .then(cleanupPlatform)
  .then(buildPackages)
  .then(copyPackages)
  .then(npmInstallPackages)
  .then(createRootPackage)
  .then(symlinkPackages)
  .then(convertCoffeeToJs)
  .then(removeTypeScript)
  .then(packages.runAllCleanJs)
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

