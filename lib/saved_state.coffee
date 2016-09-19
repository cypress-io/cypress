Conf = require("conf")
Promise = require("bluebird")
appData = require("./util/app_data")

config = new Conf({
  configName: "state"
  cwd: appData.path()
})

module.exports = {
  get: (key) ->
    Promise.try ->
      config.get(key)

  set: (state)->
    Promise.try ->
      config.set(state)

  path: config.path
}
