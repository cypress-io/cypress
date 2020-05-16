_      = require("lodash")
cache  = require("../cache")
send   = require("send")
os     = require("os")
fs     = require("../util/fs")
path   = require("path")
debug  = require("debug")("cypress:server:runner")
pkg    = require("@packages/root")
runner = require("@packages/runner/lib/resolve-dist")

PATH_TO_NON_PROXIED_ERROR = path.join(__dirname, "..", "html", "non_proxied_error.html")

_serveNonProxiedError = (res) ->
  fs.readFile(PATH_TO_NON_PROXIED_ERROR)
  .then (html) =>
    res.type('html').end(html)

module.exports = {
  serve: (req, res, options = {}) ->
    if req.proxiedUrl.startsWith('/')
      debug('request was not proxied via Cypress, erroring %o', _.pick(req, 'proxiedUrl'))
      return _serveNonProxiedError(res)

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

    runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH or runner.getPathToIndex()

    res.render(runnerPath, {
      base64Config
      projectName: config.projectName
    })

  handle: (req, res) ->
    pathToFile = runner.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)

  handleSourceMappings: (req, res) ->
    pathToFile = runner.getPathToSourceMappings()

    send(req, pathToFile)
    .pipe(res)
}
