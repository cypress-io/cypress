launcher = require("@cypress/core-launcher")
appData  = require("../util/app_data")

profiles = appData.path("browsers")

module.exports = {
  ensureProfile: (name) ->
    p = path.join(profiles, name)

    fs.ensureDirAsync(p).return(p)

  copyExtension: (src, dest) ->
    fs.copyAsync(src, dest)

  getBrowsers: ->
    launcher.detect()

  launch: (name, url, args) ->
    launcher()
    .call("launch", name, url, args)
}
