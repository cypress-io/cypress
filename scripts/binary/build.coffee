_ = require("lodash")
fse = require("fs-extra")
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

linkPackages = require('../link-packages')
meta = require("./meta")
packages = require("./util/packages")
Darwin = require("./darwin")
Linux = require("./linux")

fs = Promise.promisifyAll(fse)

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

# can pass options to better control the build
# for example
#   skipClean - do not delete "dist" folder before build
module.exports = (platform, version, options = {}) ->
  distDir = _.partial(meta.distDir, platform)
  buildDir = _.partial(meta.buildDir, platform)
  buildAppDir = _.partial(meta.buildAppDir, platform)

  log = _.partialRight(logger, platform)

  cleanupPlatform = ->
    log("#cleanupPlatform")

    if options.skipClean
      log("skipClean")
      return

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

  copyPackageProxies = (destinationFolder) ->
    () ->
      log("#copyPackageProxies")
      dest = destinationFolder("node_modules", "@packages")
      source = path.join(process.cwd(), "node_modules", "@packages")
      fs.unlinkAsync(dest).catch(_.noop)
      .then(() ->
        console.log("Copying #{source} to #{dest}")
        fs.copyAsync(source, dest)
      )

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
  .then(copyPackageProxies(distDir))
  .then(convertCoffeeToJs)
  .then(removeTypeScript)
  .then(cleanJs)
  .then(elBuilder)
  .then(copyPackageProxies(buildAppDir))
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
