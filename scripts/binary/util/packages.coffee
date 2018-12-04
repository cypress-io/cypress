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

fs = Promise.promisifyAll(fs)
glob = Promise.promisify(glob)

DEFAULT_PATHS = "package.json".split(" ")

pathToPackageJson = (pkg) ->
  path.join(pkg, "package.json")

npmRun = (args, cwd) ->
  command = "npm " + args.join(" ")
  console.log(command)
  if cwd
    console.log("in folder:", cwd)

  la(check.maybe.string(cwd), "invalid CWD string", cwd)
  execa("npm", args, { stdio: "inherit", cwd })
  # if everything is ok, resolve with nothing
  .then R.always(undefined)
  .catch (result) ->
    msg = "#{command} failed with exit code: #{result.code}"
    throw new Error(msg)

runAllBuildJs = _.partial(npmRun, ["run", "all", "build-js", "--skip-packages", "cli"])

# removes transpiled JS files in the original package folders
runAllCleanJs = _.partial(npmRun, ["run", "all", "clean-js", "--skip-packages", "cli"])

# builds all the packages except for cli
runAllBuild = _.partial(npmRun,
  ["run", "all", "build", "--", "--serial", "--skip-packages", "cli"])

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
    fs.readJsonAsync(pathToPackageJson(pkg))
    .then (json) ->
      ## grab all the files
      ## and default included paths
      ## and convert to relative paths
      DEFAULT_PATHS
      .concat(json.files or [])
      .concat(json.main or [])
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
  npmRun(["install", "--force", packageToInstall], packagePath)

npmInstallAll = (pathToPackages) ->
  ## 1,060,495,784 bytes (1.54 GB on disk) for 179,156 items
  ## 313,416,512 bytes (376.6 MB on disk) for 23,576 items

  console.log("npmInstallAll packages in #{pathToPackages}")

  started = new Date()

  retryGlobbing = ->
    glob(pathToPackages)
    .catch {code: "EMFILE"}, ->
      ## wait 1 second then retry
      Promise
      .delay(1000)
      .then(retryGlobbing)


  retryNpmInstall = (pkg) ->
    console.log("installing %s", pkg)
    console.log("NODE_ENV is %s", process.env.NODE_ENV)

    # https://docs.npmjs.com/cli/install
    npmInstall = _.partial(npmRun, ["install", "--only=production", "--quiet"])
    npmInstall(pkg)
    .catch {code: "EMFILE"}, ->
      Promise
      .delay(1000)
      .then ->
        retryNpmInstall(pkg)
    .catch (err) ->
      console.log(err, err.code)
      throw err

  ## prunes out all of the devDependencies
  ## from what was copied
  retryGlobbing()
  .mapSeries(retryNpmInstall)
  .then ->
    console.log("Finished NPM Installing", new Date() - started)

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
}

if not module.parent
  console.log("demo force install")
  forceNpmInstall("packages/server", "@ffmpeg-installer/win32-x64")
