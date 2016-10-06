os      = require("os")
fs      = require("fs-extra")
path    = require("path")
pkgr    = require("electron-packager")
icons   = require("@cypress/core-icons")
Promise = require("bluebird")
pkg     = require("../package.json")
paths   = require("./paths")

fs    = Promise.promisifyAll(fs)
pkgr  = Promise.promisify(pkgr)

## ensure we have an electronVersion set in package.json
if not electronVersion = pkg.electronVersion
  throw new Error("Missing 'electronVersion' in ./package.json")

module.exports = {
  checkCurrentVersion: ->
    pathToVersion = paths.getPathToVersion()

    ## read in the version file
    fs.readFileAsync(pathToVersion, "utf8")
    .then (str) ->
      version = str.replace("v", "")

      ## and if it doesn't match the electron version
      ## throw an error
      if version isnt electronVersion
        throw new Error("Currently installed version: '#{version}' does not match electronVersion: '#{electronVersion}")
      else
        process.exit()

  checkExecExistence: ->
    fs.statAsync(paths.getPathToExec())

  move: (src, dest) ->
    ## src  is ./tmp/Cypress-darwin-x64
    ## dest is ./dist
    fs.moveAsync(src, dest, {clobber: true})
    .then ->
      ## remove the tmp folder now
      fs.removeAsync(path.dirname(src))

  removeEmptyApp: ->
    ## nuke the temporary blank /app
    fs.removeAsync(paths.getPathToResources("app"))

  install: ->
    pkgr({
      dir: "app"
      out: "tmp"
      name: "Cypress"
      platform: os.platform()
      arch: "x64"
      asar: false
      prune: true
      overwrite: true
      version: electronVersion
      icon: icons.getPathToIcon("cypress.icns")
    })

    .then (appPaths) ->
      appPaths[0]
    .then (appPath) =>
      ## and now move the tmp into dist
      @move(appPath, "dist")
    .then =>
      @removeEmptyApp()

    .then ->
      process.exit()

    .catch (err) ->
      console.log(err.stack)
      process.exit(1)

  ensure: ->
    Promise.join(
      @checkCurrentVersion()
      @checkExecExistence()
    )

  run: ->
    @ensure()
    .bind(@)
    .catch(@install)
}