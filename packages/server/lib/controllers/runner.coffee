_      = require("lodash")
send   = require("send")
os     = require("os")
debug  = require("debug")("cypress:server:runner")
runner = require("@packages/runner")
pkg    = require("@packages/root")

module.exports = {
  serve: (req, res, options = {}) ->
    { config, getRemoteState, project } = options

    { spec, browser } = project.getCurrentSpecAndBrowser()

    config = _.clone(config)
    config.remote = getRemoteState()
    config.version = pkg.version
    config.platform = os.platform()
    config.arch = os.arch()
    config.spec = spec
    config.browser = browser

    debug("serving runner index.html with config %o",
      _.pick(config, "version", "platform", "arch", "projectName")
    )

    res.render(runner.getPathToIndex(), {
      config:      JSON.stringify(config)
      projectName: config.projectName
    })

  handle: (req, res) ->
    pathToFile = runner.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
