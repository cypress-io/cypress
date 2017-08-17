fs      = require("fs-extra")
cp      = require("child_process")
path    = require("path")
sign    = require("electron-osx-sign")
plist   = require("plist")
Promise = require("bluebird")
meta    = require("./meta")
Base    = require("./base")

sign  = Promise.promisify(sign)
fs    = Promise.promisifyAll(fs)

class Darwin extends Base
  buildPathForElectron: ->
    @buildPathToAppFolder()

  buildPathToApp: ->
    path.join @buildPathToAppFolder(), "Cypress.app"

  buildPathToAppExecutable: ->
    path.join @buildPathToApp(), "Contents", "MacOS", "Cypress"

  buildPathToAppResources: ->
    path.join @buildPathToApp(), "Contents", "Resources", "app"

  runSmokeTest: ->
    @_runSmokeTest()

  runProjectTest: ->
    @_runProjectTest()

  runFailingProjectTest: ->
    @_runFailingProjectTest()

  codeSign: ->
    @log("#codeSign")

    sign({
      app: @buildPathToApp()
      platform: "darwin"
      verbose: true
    })

  verifyAppCanOpen: ->
    @log("#verifyAppCanOpen")

    new Promise (resolve, reject) =>
      sp = cp.spawn "spctl", ["-a", "-vvvv", @buildPathToApp()], {stdio: "inherit"}
      sp.on "exit", (code) ->
        if code is 0
          resolve()
        else
          reject new Error("Verifying App via GateKeeper failed")

  deploy: ->
    @build()
    .return(@)

module.exports = Darwin
