FileUtil = require("./util/file")
appData = require("./util/app_data")

module.exports = new FileUtil({
  path: appData.path("state.json")
})
