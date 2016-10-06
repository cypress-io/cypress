Promise  = require("bluebird")
detect   = require("./detect")
browsers = require("./browsers")

missingConfig = ->
  Promise.reject(new Error("You must provide a path to a config file."))

api = (b) ->
  return {
    launch: (name, url, args = []) ->
      browsers.launch(b, name, url, args)
  }

# fn = (pathToConfig, browsers) ->
fn = (browsers) ->
  # return missingConfig() if not pathToConfig

  if browsers
    api(browsers)
  else
    fn.detect()
    .then(api)

fn.update = (pathToConfig) ->
  return missingConfig() if not pathToConfig

  ## detect the browsers and set the config
  fn.detect()
  .then (browers) ->
    fs.writeJsonAsync(pathToConfig, browers, {spaces: 2})

fn.detect = detect

module.exports = fn