fs       = require("fs-extra")
path     = require("path")
Promise  = require("bluebird")
launcher = require("@packages/launcher")
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
        info: "Electron is the default browser that comes with Cypress. This is the browser that runs in headless mode. Selecting this browser is useful when debugging. The version number indicates the underlying Chromium version that Electron uses."
      })

  launch: (name, url, args) ->
    launcher()
    .call("launch", name, url, args)
}
