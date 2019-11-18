path     = require("path")
debug    = require("debug")("cypress:server:browsers:utils")
Promise  = require("bluebird")
getPort  = require("get-port")
launcher = require("@packages/launcher")
fs       = require("../util/fs")
appData  = require("../util/app_data")
pluralize = require("pluralize")
profileCleaner = require("../util/profile_cleaner")

PATH_TO_BROWSERS = appData.path("browsers")

getBrowserPath = (browser) ->
  path.join(
    PATH_TO_BROWSERS,
    "#{browser.name}"
  )

copyExtension = (src, dest) ->
  fs.copyAsync(src, dest)

getPartition = (isTextTerminal) ->
  if isTextTerminal
    return "run-#{process.pid}"

  return "interactive"

getProfileDir = (browser, isTextTerminal) ->
  path.join(
    getBrowserPath(browser)
    getPartition(isTextTerminal),
  )

getExtensionDir = (browser, isTextTerminal) ->
  path.join(
    getProfileDir(browser, isTextTerminal),
    "CypressExtension"
  )

ensureCleanCache = (browser, isTextTerminal) ->
  p = path.join(
    getProfileDir(browser, isTextTerminal),
    "CypressCache"
  )

  fs
  .removeAsync(p)
  .then ->
    fs.ensureDirAsync(p)
  .return(p)

removeOldProfiles = ->
  ## a profile is considered old if it was used
  ## in a previous run for a PID that is either
  ## no longer active, or isnt a cypress related process
  pathToProfiles = path.join(PATH_TO_BROWSERS, "*")
  pathToPartitions = appData.electronPartitionsPath()

  Promise.all([
    ## we now store profiles in either interactive or run-* folders
    ## so we need to remove the old root profiles that existed before
    profileCleaner.removeRootProfile(pathToProfiles, [
      path.join(pathToProfiles, "run-*")
      path.join(pathToProfiles, "interactive")
    ])
    profileCleaner.removeInactiveByPid(pathToProfiles, "run-"),
    profileCleaner.removeInactiveByPid(pathToPartitions, "run-"),
  ])

module.exports = {
  getPort

  copyExtension

  getProfileDir

  getExtensionDir

  ensureCleanCache

  removeOldProfiles

  getBrowserByPath: launcher.detectByPath

  launch: launcher.launch

  getBrowsers: ->
    debug("getBrowsers")
    launcher.detect()
    .then (browsers = []) ->
      debug("found browsers %o", { browsers })

      version = process.versions.chrome or ""
      majorVersion = parseInt(version.split(".")[0]) if version
      electronBrowser = {
        name: "electron"
        family: "electron"
        displayName: "Electron"
        version: version
        path: ""
        majorVersion: majorVersion
        info: "Electron is the default browser that comes with Cypress. This is the browser that runs in headless mode. Selecting this browser is useful when debugging. The version number indicates the underlying Chromium version that Electron uses."
      }

      ## the internal version of Electron, which won't be detected by `launcher`
      debug("adding Electron browser with version %s", version)
      browsers.concat(electronBrowser)
}
