_      = require("lodash")
cache  = require("../cache")
send   = require("send")
os     = require("os")
debug  = require("debug")("cypress:server:runner")
pkg    = require("@packages/root")
runner = require("@packages/runner/lib/resolve-dist")

NON_PROXIED_ERROR = """
<html>
  <head>
    <meta http-equiv="content-type" content="text/html;charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cypress</title>

    <link href="/__cypress/static/favicon.ico" rel="icon">

    <link rel="stylesheet" href="/__cypress/runner/cypress_runner.css">
  </head>
  <body>
    <div id="app">
      <div class="runner automation-failure">
        <div class="automation-message">
          <p>Whoops, we can't run your tests.</p>
          <div>
            <p class="muted">This browser was not launched through Cypress. Tests cannot run.</p>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
"""

_serveNonProxiedError = (res) ->
  res.type('html').end(NON_PROXIED_ERROR)

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

    res.render(runner.getPathToIndex(), {
      base64Config
      projectName: config.projectName
    })

  handle: (req, res) ->
    pathToFile = runner.getPathToDist(req.params[0])

    send(req, pathToFile)
    .pipe(res)
}
