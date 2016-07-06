os   = require("os")
path = require("path")

execPath = {
  darwin:  "dist/Cypress.app/Contents/MacOS/Cypress"
  freebsd: "dist/Cypress"
  linux:   "dist/Cypress"
  # win32:   "dist/Cypress.exe"
}

resourcesPath = {
  darwin:  "dist/Cypress.app/Contents/Resources"
  freebsd: "dist/Cypress/resources"
  linux:   "dist/Cypress/resources"
  # win32:   "dist/Cypress/resources"
}

unknownPlatformErr = ->
  throw new Error("Unknown platform: '#{os.platform()}'")

normalize = (paths...) ->
  path.join(__dirname, "..", paths...)

module.exports = {
  getPathToExec: ->
    p = execPath[os.platform()] ? unknownPlatformErr()

    normalize(p)

  getPathToResources: (paths...) ->
    p = resourcesPath[os.platform()] ? unknownPlatformErr()

    p = [].concat(p, paths)

    normalize(p...)

  getPathToVersion: ->
    normalize("dist", "version")

}