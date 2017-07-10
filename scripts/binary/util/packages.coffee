_ = require("lodash")
fs = require("fs-extra")
cp = require("child_process")
path = require("path")
glob = require("glob")
Promise = require("bluebird")
la = require("lazy-ass")
check = require("check-more-types")

fs = Promise.promisifyAll(fs)
glob = Promise.promisify(glob)

DEFAULT_PATHS = "package.json".split(" ")

pathToPackageJson = (pkg) ->
  path.join(pkg, "package.json")

npmRun = (args, cwd) ->
  new Promise (resolve, reject) ->
    reject = _.once(reject)

    cp.spawn("npm", args, { stdio: "inherit", cwd })
    .on "error", reject
    .on "exit", (code) ->
      if code is 0
        resolve()
      else
        msg = "npm " + args.join(" ") + " failed with exit code: #{code}"
        reject(new Error(msg))


runAllBuildJs = _.partial(npmRun, ["run", "all", "build-js", "--skip-packages", "cli,docs"])

# removes transpiled JS files in the original package folders
runAllCleanJs = _.partial(npmRun, ["run", "all", "clean-js", "--skip-packages", "cli,docs"])

# builds all the packages except for cli and docs
runAllBuild = _.partial(npmRun,
  ["run", "all", "build", "--", "--serial", "--skip-packages", "cli,docs"])

copyAllToDist = (distDir) ->
  copyRelativePathToDist = (relative) ->
    dest = path.join(distDir, relative)

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
    npmInstall = _.partial(npmRun, ["install", "--production", "--quiet"])
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

    console.log(relativeDest, "link ->", dest)
    fs.ensureSymlinkAsync(relativeDest, dest)
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
}
