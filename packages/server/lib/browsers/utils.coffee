path     = require("path")
Promise  = require("bluebird")
launcher = require("@packages/launcher")
fs       = require("../util/fs")
appData  = require("../util/app_data")
profileCleaner = require("../util/profile_cleaner")

PATH_TO_BROWSERS = appData.path("browsers")

copyExtension = (src, dest) ->
  fs.copyAsync(src, dest)

getPartition = (isTextTerminal) ->
  if isTextTerminal
    return "run-#{process.pid}"

  return "interactive"

getProfileDir = (browserName, isTextTerminal) ->
  path.join(
    PATH_TO_BROWSERS,
    browserName,
    getPartition(isTextTerminal),
  )

getExtensionDir = (browserName, isTextTerminal) ->
  path.join(
    getProfileDir(browserName, isTextTerminal),
    "CypressExtension"
  )

ensureCleanCache = (browserName, isTextTerminal) ->
  p = path.join(
    getProfileDir(browserName, isTextTerminal),
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
  copyExtension

  getProfileDir

  getExtensionDir

  ensureCleanCache

  removeOldProfiles

  getBrowsers: ->
    ## TODO: accept an options object which
    ## turns off getting electron browser?
    launcher.detect()
    .then (browsers = []) ->
      version = process.versions.chrome or ""

      browsers.concat({
        name: "electron"
        displayName: "Electron"
        version: version
        path: ""
        majorVersion: version.split(".")[0]
        info: "Electron is the default browser that comes with Cypress. This is the browser that runs in headless mode. Selecting this browser is useful when debugging. The version number indicates the underlying Chromium version that Electron uses."
      })

  launch: (name, url, args) ->
    launcher()
    .call("launch", name, url, args)
}
