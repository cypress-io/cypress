_ = require("lodash")
fse = require("fs-extra")
os = require("os")
del = require("del")
path = require("path")
cp = require("child_process")
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
signOsxApp = require("electron-osx-sign")
debug = require("debug")("cypress:binary")

linkPackages = require('../link-packages')
meta = require("./meta")
packages = require("./util/packages")
Darwin = require("./darwin")
Linux = require("./linux")

rootPackage = require("@packages/root")

sign  = Promise.promisify(signOsxApp)
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
buildCypressApp = (platform, version, options = {}) ->
  distDir = _.partial(meta.distDir, platform)
  buildDir = _.partial(meta.buildDir, platform)
  buildAppDir = _.partial(meta.buildAppDir, platform)

  log = _.partialRight(logger, platform)

  canBuildInDocker = ->
    platform == "linux" && os.platform() == "darwin"

  badPlatformMismatch = ->
    console.error("⛔️  cannot build #{platform} from #{os.platform()}")
    console.error("⛔️  should use matching platform to build it")
    console.error("program arguments")
    console.error(process.argv)

  checkPlatform = ->
    log("#checkPlatform")
    if platform == os.platform() then return

    console.log("trying to build #{platform} from #{os.platform()}")
    if platform == "linux" && os.platform() == "darwin"
      console.log("try running ./scripts/build-linux-binary.sh")
    Promise.reject(new Error("Build platform mismatch"))

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
      description: rootPackage.description
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

  removeDevElectronApp = ->
    log("#removeDevElectronApp")
    # when we copy packages/electron, we get the "dist" folder with
    # empty Electron app, symlinked to our server folder
    # in production build, we do not need this link, and it
    # would not work anyway with code signing

    # hint: you can see all symlinks in the build folder
    # using "find build/darwin/Cypress.app/ -type l -ls"
    electronDistFolder = meta.buildAppDir(platform, "packages", "electron", "dist")
    console.log("Removing unnecessary folder #{electronDistFolder}")
    fs.removeAsync(electronDistFolder).catch(_.noop)

  runSmokeTest = ->
    log("#runSmokeTest")
    # console.log("skipping smoke test for now")
    smokeTest = smokeTests[platform]
    smokeTest()

  codeSign = ->
    if (platform != "darwin") then return Promise.resolve()

    appFolder = meta.zipDir(platform)
    log("#codeSign", appFolder)
    sign({
      app: appFolder
      platform
      verbose: true
    })

  verifyAppCanOpen = ->
    if (platform != "darwin") then return Promise.resolve()

    appFolder = meta.zipDir(platform)
    log("#verifyAppCanOpen", appFolder)
    new Promise (resolve, reject) =>
      args = ["-a", "-vvvv", appFolder]
      debug("cmd: spctl #{args.join(' ')}")
      sp = cp.spawn "spctl", args, {stdio: "inherit"}
      sp.on "exit", (code) ->
        if code is 0
          resolve()
        else
          reject new Error("Verifying App via GateKeeper failed")

  Promise.resolve()
  .then(checkPlatform)
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
  .then(removeDevElectronApp)
  .then(copyPackageProxies(buildAppDir))
  .then(runSmokeTest)
  .then(codeSign) ## codesign after running smoke tests due to changing .cy
  .then(verifyAppCanOpen)
  .return({
    buildDir: buildDir()
  })

module.exports = buildCypressApp
