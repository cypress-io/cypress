Conf = require("conf")
Promise = require("bluebird")
appData = require("./util/app_data")

config = new Conf({
  async: true
  configName: "state"
  cwd: appData.path()
})

module.exports = {
  get: Promise.promisify(config.getAsync.bind(config))
  set: Promise.promisify(config.setAsync.bind(config))
  path: config.path
}
