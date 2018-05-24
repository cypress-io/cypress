_      = require("lodash")
send   = require("send")
os     = require("os")
debug  = require("debug")("cypress:server")
runner = require("@packages/runner")
pkg    = require("@packages/root")
openProject = require("../open_project")

module.exports = {
  serve: (req, res, config, getRemoteState) ->
    config = _.clone(config)
    config.remote = getRemoteState()
    config.version = pkg.version
    config.platform = os.platform()
    config.arch = os.arch()
    config.browser = openProject.getCurrentBrowser(config)
    debug("config version %s platform %s arch %s",
      config.version, config.platform, config.arch)

    res.render runner.getPathToIndex(), {
      config:      JSON.stringify(config)
      projectName: config.projectName
    }

  handle: (req, res) ->
    pathToFile = runner.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
