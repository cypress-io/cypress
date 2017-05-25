FileUtil = require("./util/file")
appData = require("./util/app_data")
log = require('./log')

log('making saved state from %s', process.cwd())

module.exports = new FileUtil({
  path: appData.path("state.json")
})
