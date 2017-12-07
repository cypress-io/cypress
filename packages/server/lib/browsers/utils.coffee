fs       = require("fs-extra")
path     = require("path")
Promise  = require("bluebird")
la       = require("lazy-ass")
check    = require("check-more-types")
log      = require("debug")("cypress:server:browsers")
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

  getBrowsers: (browserName) ->
    la(check.maybe.unemptyString(browserName), "invalid browser name", browserName)
    if browserName
      log("getBrowsers for specific browser name", browserName)

    ## TODO: accept an options object which
    ## turns off getting electron browser?
    launcher.detect(browserName)
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
    log("launching %s to open %s", name, url)
    launcher(name)
    .then (detectedBrowser) ->
      if not detectedBrowser
        throw new Error("Cannot find browser #{name}")
      detectedBrowser.launch(name, url, args)
}
