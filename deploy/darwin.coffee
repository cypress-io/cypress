fs      = require("fs-extra")
cp      = require("child_process")
path    = require("path")
sign    = require("electron-osx-sign")
plist   = require("plist")
Promise = require("bluebird")
meta    = require("./meta")
Base    = require("./base")

fs    = Promise.promisifyAll(fs)

class Darwin extends Base
  buildPathToAppExecutable: ->
    path.join meta.buildDir, @platform, "Cypress.app", "Contents", "MacOS", "Cypress"

  buildPathToAppFolder: ->
    path.join meta.buildDir, @platform, "Cypress.app"

  verifyAppCanOpen: ->
    @log("#verifyAppCanOpen")

    new Promise (resolve) =>
      sp = cp.spawn "spctl", ["-a", @buildPathToAppFolder()], {stdio: "inherit"}
      sp.on "exit", (code) ->
        if code is 0
          resolve()
        else
          throw new Error("Verifying App via GateKeeper failed")

  runSmokeTest: ->
    @_runSmokeTest()

  afterBuild: (pathToBuilds) ->
    @log("#afterBuild")

    Promise.all([
      @renameExecutable(pathToBuilds[0])
      @modifyPlist(pathToBuilds[0])
    ])

  renameExecutable: (pathToBuild) ->
    pathToElectron = path.join(pathToBuild, "Cypress.app", "Contents", "MacOS", "Electron")
    pathToCypress  = path.join(path.dirname(pathToElectron), "Cypress")

    fs.renameAsync(pathToElectron, pathToCypress)

  modifyPlist: (pathToBuild) ->
    pathToPlist = path.join(pathToBuild, "Cypress.app", "Contents", "Info.plist")

    fs.readFileAsync(pathToPlist, "utf8").then (contents) ->
      obj = plist.parse(contents)
      obj.CFBundleExecutable = "Cypress"
      obj.LSUIElement = 1
      fs.writeFileAsync(pathToPlist, plist.build(obj))

  codeSign: ->
    @log("#codeSign")

    sign({
      app: @buildPathToAppFolder()
      platform: "darwin"
      verbose: true
    })

    # new Promise (resolve, reject) =>
    #   sp = child_process.spawn "sh", ["./support/codesign.sh", @buildPathToAppFolder()], {stdio: "inherit"}
    #   sp.on "exit", (code) ->
    #     if code is 0
    #       resolve()
    #     else
    #       throw new Error("Code Signing failed.")

  deploy: ->
    @dist()

module.exports = Darwin