scale = ->
  try
    app = require("electron").app
    app.commandLine.appendSwitch("force-device-scale-factor", "1")

ready = ->
  Promise = require("bluebird")
  app = require("electron").app

  waitForReady = ->
    new Promise (resolve, reject) ->
      app.on "ready", resolve

  Promise.any([
    waitForReady()
    Promise.delay(500)
  ])

module.exports = {
  scale

  ready
}
