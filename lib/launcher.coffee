Promise  = require("bluebird")
detect   = require("./detect")
browsers = require("./browsers")

api = (config) ->
  return {
    launch: (browser, url, args = []) ->
      browsers.launch(config, browser, url, args)
  }

fn = (pathToConfig) ->
  @update(pathToConfig)
  .then(api)

fn.update = (pathToConfig) ->
  ## detect the browsers and set the config
  @detect()
  .then (json) ->
    fs.writeJsonAsync(pathToConfig, json, {spaces: 2})

fn.detect = detect

module.exports = fn