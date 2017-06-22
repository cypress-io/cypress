fs = require("fs-extra")
path = require("path")
chalk = require("chalk")
Promise = require("bluebird")
packages = require("./util/packages")

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

  symlinkPackages = ->
    log("#symlinkPackages", platform)

    packages.symlinkAll(distDir)

  Promise
  .bind(@)
  .then(cleanupPlatform)
  .then(buildPackages)
  .then(copyPackages)
  .then(npmInstallPackages)
  .then(createRootPackage)
  .then(symlinkPackages)
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
  # .return(@)
