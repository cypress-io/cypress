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
{ transformRequires } = require('./util/transform-requires')
{ testStaticAssets } = require('./util/testStaticAssets')
performanceTracking = require('../../packages/server/test/support/helpers/performance.js')

rootPackage = require("@packages/root")

fs = Promise.promisifyAll(fse)

logger = (msg, platform) ->
  time = new Date()
  timeStamp = time.toLocaleTimeString()
  console.log(timeStamp, chalk.yellow(msg), chalk.blue(platform))

logBuiltAllPackages = () ->
  console.log("built all packages")

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
      console.log('✅ using node --version works')

  testBuiltStaticAssets = ->
    log('#testBuiltStaticAssets')
    testStaticAssets(distDir())

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

  copyPackages = ->
    log("#copyPackages")

    packages.copyAllToDist(distDir())

  transformSymlinkRequires = ->
    log("#transformSymlinkRequires")

    transformRequires(distDir())
    .then (replaceCount) ->
      la(replaceCount > 5, 'expected to replace more than 5 symlink requires, but only replaced', replaceCount)

  npmInstallPackages = ->
    log("#npmInstallPackages")

    pathToPackages = distDir("packages", "*")
    packages.npmInstallAll(pathToPackages)

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
      process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV || 'production'
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

  # we also don't need ".bin" links inside Electron application
  # thus we can go through dist/packages/*/node_modules and remove all ".bin" folders
  removeBinFolders = ->
    log("#removeBinFolders")

    searchMask = distDir("packages", "*", "node_modules", ".bin")
    console.log("searching for", searchMask)

    del([searchMask])
    .then (paths) ->
      console.log(
        "deleted %d .bin %s",
        paths.length,
        pluralize("folder", paths.length)
      )
      console.log(paths)

  removeCyFolders = ->
    log("#removeCyFolders")

    searchMask = distDir("packages", "server", ".cy")
    console.log("searching", searchMask)

    del([searchMask])
    .then (paths) ->
      console.log(
        "deleted %d .cy %s",
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
      ], { sourcemaps: true })
      .pipe vinylPaths(del)
      .pipe(gulpDebug())
      .pipe gulpCoffee({
        coffee: coffee
      })
      .pipe gulp.dest(distDir())
      .on("end", resolve)
      .on("error", reject)

  getIconFilename = (platform) ->
    filenames = {
      darwin: "cypress.icns"
      win32: "cypress.ico"
      linux: "icon_512x512.png"
    }
    iconFilename = electron.icons().getPathToIcon(filenames[platform])
    console.log("For platform #{platform} using icon #{iconFilename}")
    iconFilename

  electronPackAndSign = ->
    log("#electronPackAndSign")

    # See the internal wiki document "Signing Test Runner on MacOS"
    # to learn how to get the right Mac certificate for signing and notarizing
    # the built Test Runner application

    appFolder = distDir()
    outputFolder = meta.buildRootDir(platform)
    electronVersion = electron.getElectronVersion()
    la(check.unemptyString(electronVersion), "missing Electron version to pack", electronVersion)
    iconFilename = getIconFilename(platform)

    console.log("output folder: #{outputFolder}")

    args = [
      "--publish=never",
      "--c.electronVersion=#{electronVersion}",
      "--c.directories.app=#{appFolder}",
      "--c.directories.output=#{outputFolder}",
      "--c.icon=#{iconFilename}",
      # for now we cannot pack source files in asar file
      # because electron-builder does not copy nested folders
      # from packages/*/node_modules
      # see https://github.com/electron-userland/electron-builder/issues/3185
      # so we will copy those folders later ourselves
      "--c.asar=false"
    ]
    opts = {
      stdio: "inherit"
    }
    console.log("electron-builder arguments:")
    console.log(args.join(' '))

    execa('electron-builder', args, opts)

  removeDevElectronApp = ->
    log("#removeDevElectronApp")
    # when we copy packages/electron, we get the "dist" folder with
    # empty Electron app, symlinked to our server folder
    # in production build, we do not need this link, and it
    # would not work anyway with code signing

    # hint: you can see all symlinks in the build folder
    # using "find build/darwin/Cypress.app/ -type l -ls"
    console.log("platform", platform)
    electronDistFolder = distDir("packages", "electron", "dist")
    la(check.unemptyString(electronDistFolder),
      "empty electron dist folder for platform", platform)

    console.log("Removing unnecessary folder '#{electronDistFolder}'")
    fs.removeAsync(electronDistFolder) # .catch(_.noop) why are we ignoring an error here?!

  lsDistFolder = ->
    log('#lsDistFolder')
    buildFolder = buildDir()
    console.log("in build folder %s", buildFolder)
    execa('ls', ['-la', buildFolder])
    .then R.prop("stdout")
    .then console.log

  runSmokeTests = ->
    log("#runSmokeTests")

    run = ->
      # make sure to use a longer timeout - on Mac the first
      # launch of a built application invokes gatekeeper check
      # which takes a couple of seconds
      executablePath = meta.buildAppExecutable(platform)
      smoke.test(executablePath)

    if xvfb.isNeeded()
      xvfb.start()
      .then(run)
      .finally(xvfb.stop)
    else
      run()

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

  printPackageSizes = ->
    appFolder = meta.buildAppDir(platform, "packages")
    log("#printPackageSizes #{appFolder}")

    if (platform == "win32") then return Promise.resolve()

    # "du" - disk usage utility
    # -d -1 depth of 1
    # -h human readable sizes (K and M)
    args = ["-d", "1", appFolder]

    parseDiskUsage = (result) ->
      lines = result.stdout.split(os.EOL)
      # will store {package name: package size}
      data = {}

      lines.forEach (line) ->
        parts = line.split('\t')
        packageSize = parseFloat(parts[0])
        folder = parts[1]

        packageName = path.basename(folder)
        if packageName is "packages"
          return # root "packages" information

        data[packageName] = packageSize

      return data

    printDiskUsage = (sizes) ->
      bySize = R.sortBy(R.prop('1'))
      console.log(bySize(R.toPairs(sizes)))

    execa("du", args)
    .then(parseDiskUsage)
    .then(R.tap(printDiskUsage))
    .then((sizes) ->
      performanceTracking.track('test runner size', sizes)
    )

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
  .then(testBuiltStaticAssets)
  .then(removeBinFolders)
  .then(removeCyFolders)
  .then(removeDevElectronApp)
  .then(electronPackAndSign)
  .then(lsDistFolder)
  .then(testVersion(buildAppDir))
  .then(runSmokeTests)
  .then(verifyAppCanOpen)
  .then(printPackageSizes)
  .return({
    buildDir: buildDir()
  })

module.exports = buildCypressApp
