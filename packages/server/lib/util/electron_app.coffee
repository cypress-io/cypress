Promise = require("bluebird")

ready = ->
  app = require("electron").app

  waitForReady = ->
    new Promise (resolve, reject) ->
      app.on "ready", resolve

  Promise.any([
    waitForReady()
    Promise.delay(500)
  ])

module.exports = {
  ready
}
