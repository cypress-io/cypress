FileUtil = require("./util/file")
appData = require("./util/app_data")
log = require('./log')

log('making saved state in CWD %s', process.cwd())

statePath = appData.path("state.json")
log('state path %s', statePath)

module.exports = new FileUtil({
  path: statePath
})
