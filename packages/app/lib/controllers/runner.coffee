_      = require("lodash")
send   = require("send")
runner = require("../../../runner")
pkg    = require("../../package.json")

module.exports = {
  serve: (req, res, config, getRemoteState) ->
    config = _.clone(config)
    config.remote = getRemoteState()
    config.version = pkg.version

    res.render runner.getPathToIndex(), {
      config:      JSON.stringify(config)
      projectName: config.projectName
    }

  handle: (req, res) ->
    pathToFile = runner.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
