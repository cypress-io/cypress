Conf = require("conf")
Promise = require("bluebird")
appData = require("./util/app_data")

config = new Conf({
  async: true
  configName: "state"
  cwd: appData.path()
})

getAsync = Promise.promisify(config.getAsync.bind(config))
setAsync = Promise.promisify(config.setAsync.bind(config))

module.exports = {
  get: (key) ->
    getAsync(key).tap ->

  set: (state)->
    setAsync(state).tap ->

  path: config.path
}
