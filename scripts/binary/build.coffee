_ = require("lodash")
fs = require("fs-extra")
del = require("del")
path = require("path")
gulp = require("gulp")
chalk = require("chalk")
Promise = require("bluebird")
gulpDebug = require("gulp-debug")
gulpCoffee = require("gulp-coffee")
gulpTypeScript = require("gulp-typescript")
pluralize = require("pluralize")
vinylPaths = require("vinyl-paths")
coffee = require("@packages/coffee")
electron = require("@packages/electron")

meta = require("./meta")
packages = require("./util/packages")
Darwin = require("./darwin")
Linux = require("./linux")

fs = Promise.promisifyAll(fs)

logger = (msg, platform) ->
  console.log(chalk.yellow(msg), chalk.bgWhite(chalk.black(platform)))

runDarwinSmokeTest = ->
  darwin = new Darwin("darwin")
  darwin.runSmokeTest()

runLinuxSmokeTest = ->
  linux = new Linux("linux")
  linux.runSmokeTest()

smokeTests = {
  darwin: runDarwinSmokeTest,
  linux: runLinuxSmokeTest
}

module.exports = (platform, version) ->
  distDir = _.partial(meta.distDir, platform)
  buildDir = _.partial(meta.buildDir, platform)
  buildAppDir = _.partial(meta.buildAppDir, platform)

  log = _.partialRight(logger, platform)

  cleanupPlatform = ->
    log("#cleanupPlatform")

    cleanup = =>
      fs.removeAsync(distDir())

    cleanup()
    .catch(cleanup)

  buildPackages = ->
    log("#buildPackages")

    packages.runAllBuild()
    .then(packages.runAllBuildJs)

  copyPackages = ->
    log("#copyPackages")

    packages.copyAllToDist(distDir())

  npmInstallPackages = ->
    log("#npmInstallPackages")

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
      str = """
      process.env.CYPRESS_ENV = 'production'
      require('./packages/server')
      """

      fs.outputFileAsync(distDir("index.js"), str)

  symlinkPackages = ->
    log("#symlinkPackages")

    packages.symlinkAll(distDir("packages", "*", "package.json"), distDir)

  removeTypeScript = ->
    ## remove the .ts files in our packages
    log("#removeTypeScript")
    del([
      ## include coffee files of packages
      distDir("**", "*.ts")

      ## except those in node_modules
      "!" + distDir("**", "node_modules", "**", "*.ts")
    ])
    .then (paths) ->
      console.log(
        "deleted %d TS %s",
        paths.length,
        pluralize("file", paths.length)
      )
      console.log(paths)

  symlinkBuildPackages = ->
    log("#symlinkBuildPackages")
    wildCard = buildAppDir("packages", "*", "package.json")
    console.log("packages", wildCard)
    packages.symlinkAll(
      wildCard,
      buildAppDir
    )

  symlinkDistPackages = ->
    log("#symlinkDistPackages")

    packages.symlinkAll(
      distDir("packages", "*", "package.json"),
      distDir
    )

  cleanJs = ->
    log("#cleanJs")

    packages.runAllCleanJs()

  convertCoffeeToJs = ->
    log("#convertCoffeeToJs")

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
    log("#elBuilder")
    dir = distDir()
    dist = buildDir()
    console.log("from #{dir}")
    console.log("into #{dist}")

    electron.install({
      dir
      dist
      platform
      "app-version": version
    })

  runSmokeTest = ->
    log("#runSmokeTest")
    # console.log("skipping smoke test for now")
    smokeTest = smokeTests[platform]
    smokeTest()

  Promise.resolve()
  .then(cleanupPlatform)
  .then(buildPackages)
  .then(copyPackages)
  .then(npmInstallPackages)
  .then(createRootPackage)
  .then(symlinkPackages)
  .then(convertCoffeeToJs)
  .then(removeTypeScript)
  .then(cleanJs)
  .then(symlinkDistPackages)
  .then(@obfuscate)
  .then(@cleanupSrc)
  .then(@npmInstall)
  .then(@npmInstall)
  .then(elBuilder)
  .then(symlinkBuildPackages)
  .then(runSmokeTest)

  # older build steps
  # .then(@runProjectTest)
  # .then(@runFailingProjectTest)
  # .then(@cleanupCy)
  # .then(@codeSign) ## codesign after running smoke tests due to changing .cy
  # .then(@verifyAppCanOpen)
  .return({
    buildDir: buildDir()
  })
