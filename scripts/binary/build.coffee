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
execa = require("execa")
electron = require("@packages/electron")
debug = require("debug")("cypress:binary")
R = require("ramda")
la = require("lazy-ass")
check = require("check-more-types")
humanInterval = require("human-interval")

meta = require("./meta")
smoke = require("./smoke")
packages = require("./util/packages")
xvfb = require("../../cli/lib/exec/xvfb")
linkPackages = require('../link-packages')
{ transformRequires } = require('./util/transform-requires')

rootPackage = require("@packages/root")

fs = Promise.promisifyAll(fse)

logger = (msg, platform) ->
  time = new Date()
  timeStamp = time.toLocaleTimeString()
  console.log(timeStamp, chalk.yellow(msg), chalk.blue(platform))

logBuiltAllPackages = () ->
  console.log("built all packages")

logBuiltAllJs = () ->
  console.log("built all JS")

# can pass options to better control the build
# for example
#   skipClean - do not delete "dist" folder before build
buildCypressApp = (platform, version, options = {}) ->
  la(check.unemptyString(version), "missing version to build", version)

  distDir = _.partial(meta.distDir, platform)
  buildDir = _.partial(meta.buildDir, platform)
  buildAppDir = _.partial(meta.buildAppDir, platform)

  log = _.partialRight(logger, platform)

  testVersion = (folderNameFn) -> () ->
    log("#testVersion")
    dir = folderNameFn()
    la(check.unemptyString(dir), "missing folder for platform", platform)
    console.log("testing dist package version")
    console.log("by calling: node index.js --version")
    console.log("in the folder %s", dir)

    execa("node", ["index.js", "--version"], {
      cwd: dir
    }).then (result) ->
      la(check.unemptyString(result.stdout),
        'missing output when getting built version', result)

      console.log('app in %s', dir)
      console.log('built app version', result.stdout)
      la(result.stdout == version, "different version reported",
        result.stdout, "from input version to build", version)

  canBuildInDocker = ->
    platform is "linux" and os.platform() is "darwin"

  badPlatformMismatch = ->
    console.error("⛔️  cannot build #{platform} from #{os.platform()}")
    console.error("⛔️  should use matching platform to build it")
    console.error("program arguments")
    console.error(process.argv)

  checkPlatform = ->
    log("#checkPlatform")
    if platform is os.platform()
      return

    console.log("trying to build #{platform} from #{os.platform()}")
    if platform is "linux" and os.platform() is "darwin"
      console.log("npm run binary-build-linux")
    Promise.reject(new Error("Build platform mismatch"))

  cleanupPlatform = ->
    log("#cleanupPlatform")

    if options.skipClean
      log("skipClean")
      return

    cleanup = ->
      dir = distDir()
      la(check.unemptyString(dir), "empty dist dir", dir, "for platform", platform)
      fs.removeAsync(distDir())

    cleanup()
    .catch(cleanup)

  buildPackages = ->
    log("#buildPackages")

    packages.runAllBuild()
    # Promise.resolve()
    .then(R.tap(logBuiltAllPackages))
    .then(packages.runAllBuildJs)
    .then(R.tap(logBuiltAllJs))

  copyPackages = ->
    log("#copyPackages")

    packages.copyAllToDist(distDir())

  transformSymlinkRequires = ->
    log("#transformSymlinkRequires")

    transformRequires(distDir())


  npmInstallPackages = ->
    log("#npmInstallPackages")

    packages.npmInstallAll(distDir("packages", "*"), options)

  createRootPackage = ->
    log("#createRootPackage #{platform} #{version}")

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
      process.env.CYPRESS_ENV = process.env.CYPRESS_ENV || 'production'
      require('./packages/server')
      """

      fs.outputFileAsync(distDir("index.js"), str)

  removeTypeScript = ->
    ## remove the .ts files in our packages
    log("#removeTypeScript")
    del([
      ## include ts files of packages
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
      appVersion: version
    })

  removeDevElectronApp = ->
    log("#removeDevElectronApp")
    # when we copy packages/electron, we get the "dist" folder with
    # empty Electron app, symlinked to our server folder
    # in production build, we do not need this link, and it
    # would not work anyway with code signing

    # hint: you can see all symlinks in the build folder
    # using "find build/darwin/Cypress.app/ -type l -ls"
    console.log("platform", platform)
    electronDistFolder = meta.buildAppDir(platform, "packages", "electron", "dist")
    la(check.unemptyString(electronDistFolder),
      "empty electron dist folder for platform", platform)

    console.log("Removing unnecessary folder '#{electronDistFolder}'")
    fs.removeAsync(electronDistFolder).catch(_.noop)

  runSmokeTests = ->
    log("#runSmokeTests")

    run = ->
      smoke.test(meta.buildAppExecutable(platform))

    if xvfb.isNeeded()
      xvfb.start()
      .then(run)
      .finally(xvfb.stop)
    else
      run()

  codeSign = Promise.method ->
    if platform isnt "darwin"
      # do we need to code sign on Windows?
      return

    appFolder = meta.zipDir(platform)
    fiveMinutes = humanInterval("5 minutes")

    execaBuild = Promise.method ->
      log("#codeSign #{appFolder}")

      execa('build', ["--publish", "never", "--prepackaged", appFolder], {
        stdio: "inherit"
      })
      .catch (err) ->
        ## ignore canceled errors
        if err.isCanceled
          return

        throw err

    ## try to build and if we timeout in 5 minutes
    ## then try again - which sometimes happens in
    ## circle CI
    b = execaBuild()

    b
    .timeout(fiveMinutes)
    .catch Promise.TimeoutError, (err) ->
      console.log(
        chalk.red("timed out signing binary after #{fiveMinutes}ms. retrying...")
      )

      b.cancel()

      execaBuild()


  verifyAppCanOpen = ->
    if (platform != "darwin") then return Promise.resolve()

    appFolder = meta.zipDir(platform)
    log("#verifyAppCanOpen #{appFolder}")
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
  .then(convertCoffeeToJs)
  .then(removeTypeScript)
  .then(cleanJs)
  .then(transformSymlinkRequires)
  .then(testVersion(distDir))
  .then(elBuilder) # should we delete everything in the buildDir()?
  .then(removeDevElectronApp)
  .then(testVersion(buildAppDir))
  .then(runSmokeTests)
  .then(codeSign) ## codesign after running smoke tests due to changing .cy
  .then(verifyAppCanOpen)
  .return({
    buildDir: buildDir()
  })

module.exports = buildCypressApp
