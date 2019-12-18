_      = require("lodash")
send   = require("send")
os     = require("os")
debug  = require("debug")("cypress:server:runner")
pkg    = require("@packages/root")
runner = require("@packages/runner/lib/resolve-dist")

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
    # log the env object's keys without values to avoid leaking sensitive info
    debug("env object has the following keys: %s", _.keys(config.env).join(", "))

    ## base64 before embedding so user-supplied contents can't break out of <script>
    ## https://github.com/cypress-io/cypress/issues/4952
    base64Config = Buffer.from(JSON.stringify(config)).toString('base64')

    res.render(runner.getPathToIndex(), {
      base64Config
      projectName: config.projectName
    })

  handle: (req, res) ->
    pathToFile = runner.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
