os   = require("os")
path = require("path")

distPath = "dist/Cypress"

execPath = {
  darwin:  "Cypress.app/Contents/MacOS/Cypress"
  freebsd: "Cypress"
  linux:   "Cypress"
  win32:   "Cypress.exe"
}

resourcesPath = {
  darwin:  "Cypress.app/Contents/Resources"
  freebsd: "resources"
  linux:   "resources"
  win32:   "resources"
}

unknownPlatformErr = ->
  throw new Error("Unknown platform: '#{os.platform()}'")

normalize = (paths...) ->
  path.join(__dirname, "..", paths...)

module.exports = {
  getPathToDist: (paths...) ->
    paths = [distPath].concat(paths)

    normalize(paths...)

  getPathToExec: ->
    p = execPath[os.platform()] ? unknownPlatformErr()

    @getPathToDist(p)

  getPathToResources: (paths...) ->
    p = resourcesPath[os.platform()] ? unknownPlatformErr()

    p = [].concat(p, paths)

    @getPathToDist(p...)

  getPathToVersion: ->
    @getPathToDist("version")

  getSymlinkType: ->
    if os.platform() == "win32" 
      "junction" 
    else 
      "dir"
}
