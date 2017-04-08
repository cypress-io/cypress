fs       = require("fs-extra")
path     = require("path")
Promise  = require("bluebird")
launcher = require("@cypress/core-launcher")
appData  = require("../util/app_data")

fs = Promise.promisifyAll(fs)

profiles = appData.path("browsers")

module.exports = {
  ensureProfile: (name) ->
    p = path.join(profiles, name)

    fs.ensureDirAsync(p).return(p)

  copyExtension: (src, dest) ->
    fs.copyAsync(src, dest)

  getBrowsers: ->
    ## TODO: accept an options object which
    ## turns off getting electron browser?
    launcher.detect()
    .then (browsers = []) ->
      version = process.versions.chrome or ""

      browsers.concat({
        name: "electron"
        version: version
        path: ""
        majorVersion: version.split(".")[0]
        info: "The Electron browser is the version of Chrome that is bundled with Electron. Cypress uses this browser when running headlessly, so it may be useful for debugging issues that occur only in headless mode."
      })

  launch: (name, url, args) ->
    launcher()
    .call("launch", name, url, args)
}
