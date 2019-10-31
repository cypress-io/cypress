_ = require("lodash")
fs = require("fs-extra")
cp = require("child_process")
path = require("path")
glob = require("glob")
Promise = require("bluebird")
retry = require("bluebird-retry")
la = require("lazy-ass")
check = require("check-more-types")
execa = require("execa")
R = require("ramda")
os = require("os")
prettyMs = require("pretty-ms")
pluralize = require('pluralize')

fs = Promise.promisifyAll(fs)
glob = Promise.promisify(glob)

DEFAULT_PATHS = "package.json".split(" ")

pathToPackageJson = (packageFolder) ->
  la(check.unemptyString(packageFolder), "expected package path", packageFolder)
  path.join(packageFolder, "package.json")

createCLIExecutable = (command) ->
  (args, cwd, env = {}) ->
    commandToExecute = "#{command} " + args.join(" ")
    console.log(commandToExecute)
    if cwd
      console.log("in folder:", cwd)

    la(check.maybe.string(cwd), "invalid CWD string", cwd)
    execa(command, args, { stdio: "inherit", cwd, env })
    # if everything is ok, resolve with nothing
    .then R.always(undefined)
    .catch (result) ->
      msg = "#{commandToExecute} failed with exit code: #{result.code}"
      throw new Error(msg)

npm = createCLIExecutable('npm')
npx = createCLIExecutable('npx')

runAllBuildJs = _.partial(npx, ["lerna", "run", "build-js", "--ignore", "cli"])

# removes transpiled JS files in the original package folders
runAllCleanJs = _.partial(npx, ["lerna", "run", "clean-js", "--ignore", "cli"])

# builds all the packages except for cli
runAllBuild = (args...) ->
  getPackagesWithScript('build')
  .then (pkgNameArr) ->
    pkgs = pkgNameArr
      .map((pkgName) ->
        "@packages/#{pkgName}"
      )
      .join(',')
    npx(
      ["lerna", "run", "build-prod", "--scope", "\"{#{pkgs}}\"", "--ignore", "cli"]
      args...
    )

## @returns string[] with names of packages, e.g. ['runner', 'driver', 'server']
getPackagesWithScript = (scriptName) ->
  Promise.resolve(glob('./packages/*/package.json'))
  .map (pkgPath) ->
    fs.readJsonAsync(pkgPath)
    .then (json) ->
      if json.scripts?.build
        return path.basename(path.dirname(pkgPath))
  .filter(Boolean)

copyAllToDist = (distDir) ->
  copyRelativePathToDist = (relative) ->
    dest = path.join(distDir, relative)

    retry ->
      console.log(relative, "->", dest)

      fs.copyAsync(relative, dest)

  copyPackage = (pkg) ->
    ## copies the package to dist
    ## including the default paths
    ## and any specified in package.json files
    Promise.resolve(fs.readJsonAsync(pathToPackageJson(pkg)))
    .then (json) ->
      ## grab all the files
      ## and default included paths
      ## and convert to relative paths
      Promise.resolve(
        DEFAULT_PATHS
        .concat(json.files or [])
        .concat(json.main or [])
        .map (file) ->
          path.join(pkg, file)
      )
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

  fs.ensureDirAsync(distDir)
  .then ->
    glob("./packages/*")
    .map(copyPackage, {concurrency: 1})
  .then ->
    console.log("Finished Copying", new Date() - started)

forceNpmInstall = (packagePath, packageToInstall) ->
  console.log("Force installing %s", packageToInstall)
  console.log("in %s", packagePath)
  la(check.unemptyString(packageToInstall), "missing package to install")
  npm(["install", "--force", packageToInstall], packagePath)

removeDevDependencies = (packageFolder) ->
  packagePath = pathToPackageJson(packageFolder)
  console.log("removing devDependencies from %s", packagePath)

  fs.readJsonAsync(packagePath)
  .then (json) ->
    delete json.devDependencies
    fs.writeJsonAsync(packagePath, json, {spaces: 2})

retryGlobbing = (pathToPackages, delay = 1000) ->
  retryGlob = ->
    glob(pathToPackages)
    .catch {code: "EMFILE"}, ->
      ## wait, then retry
      Promise
      .delay(delay)
      .then(retryGlob)

  retryGlob()

# installs all packages given a wildcard
# pathToPackages would be something like "C:\projects\cypress\dist\win32\packages\*"
npmInstallAll = (pathToPackages) ->
  console.log("npmInstallAll packages in #{pathToPackages}")

  started = new Date()

  retryNpmInstall = (pkg) ->
    console.log("installing %s", pkg)
    console.log("NODE_ENV is %s", process.env.NODE_ENV)

    # force installing only PRODUCTION dependencies
    # https://docs.npmjs.com/cli/install
    npmInstall = _.partial(npm, ["install", "--only=production", "--quiet"])

    npmInstall(pkg, {NODE_ENV: "production"})
    .catch {code: "EMFILE"}, ->
      Promise
      .delay(1000)
      .then ->
        retryNpmInstall(pkg)
    .catch (err) ->
      console.log(err, err.code)
      throw err

  printFolders = (folders) ->
    console.log("found %s", pluralize("folder", folders.length, true))

  ## only installs production dependencies
  retryGlobbing(pathToPackages)
  .tap(printFolders)
  .mapSeries (packageFolder) ->
    removeDevDependencies(packageFolder)
    .then ->
      retryNpmInstall(packageFolder)
  .then ->
    end = new Date()
    console.log("Finished NPM Installing", prettyMs(end - started))

removePackageJson = (filename) ->
  if filename.endsWith("/package.json") then path.dirname(filename) else filename

ensureFoundSomething = (files) ->
  if files.length == 0
    throw new Error("Could not find any files")
  files

symlinkType = () ->
  if os.platform() == "win32"
    "junction"
  else
    "dir"

symlinkAll = (pathToDistPackages, pathTo) ->
  console.log("symlink these packages", pathToDistPackages)
  la(check.unemptyString(pathToDistPackages),
    "missing paths to dist packages", pathToDistPackages)

  baseDir = path.dirname(pathTo())
  toBase = path.relative.bind(null, baseDir)

  symlink = (pkg) ->
    # console.log(pkg, dist)
    ## strip off the initial './'
    ## ./packages/foo -> node_modules/@packages/foo
    pkg = removePackageJson(pkg)
    dest = pathTo("node_modules", "@packages", path.basename(pkg))
    relativeDest = path.relative(dest + '/..', pkg)

    type = symlinkType()
    console.log(relativeDest, "link ->", dest, "type", type)

    fs.ensureSymlinkAsync(relativeDest, dest, symlinkType)
    .catch((err) ->
      if not err.message.includes "EEXIST"
        throw err
    )

  glob(pathToDistPackages)
  .then(ensureFoundSomething)
  .map(symlink)

module.exports = {
  runAllBuild

  runAllBuildJs

  copyAllToDist

  npmInstallAll

  symlinkAll

  runAllCleanJs

  forceNpmInstall

  getPackagesWithScript
}

if not module.parent
  console.log("demo force install")
  forceNpmInstall("packages/server", "@ffmpeg-installer/win32-x64")
