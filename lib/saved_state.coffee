Conf = require("./util/conf")
appData = require("./util/app_data")

module.exports = new Conf({
  configName: "state"
  cwd: appData.path()
})
