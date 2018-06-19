path        = require("path")
la          = require("lazy-ass")
check       = require("check-more-types")
debug       = require("debug")("cypress:server:routes")

CacheBuster = require("./util/cache_buster")
cwd         = require("./cwd")
logger      = require("./logger")
spec        = require("./controllers/spec")
reporter    = require("./controllers/reporter")
runner      = require("./controllers/runner")
xhrs        = require("./controllers/xhrs")
client      = require("./controllers/client")
files       = require("./controllers/files")
proxy       = require("./controllers/proxy")
driver      = require("./controllers/driver")
staticCtrl  = require("./controllers/static")

module.exports = (app, config, request, getRemoteState, project) ->
  ## routing for the actual specs which are processed automatically
  ## this could be just a regular .js file or a .coffee file
  app.get "/__cypress/tests", (req, res, next) ->
    ## slice out the cache buster
    test = CacheBuster.strip(req.query.p)

    spec.handle(test, req, res, config, next, project)

  app.get "/__cypress/socket.io.js", (req, res) ->
    client.handle(req, res)

  app.get "/__cypress/reporter/*", (req, res) ->
    reporter.handle(req, res)

  app.get "/__cypress/runner/*", (req, res) ->
    runner.handle(req, res)

  app.get "/__cypress/driver/*", (req, res) ->
    driver.handle(req, res)

  app.get "/__cypress/static/*", (req, res) ->
    staticCtrl.handle(req, res)

  ## routing for /files JSON endpoint
  app.get "/__cypress/files", (req, res) ->
    files.handleFiles(req, res, config)

  ## routing for the dynamic iframe html
  app.get "/__cypress/iframes/*", (req, res) ->
    files.handleIframe(req, res, config, getRemoteState)

  app.all "/__cypress/xhrs/*", (req, res, next) ->
    xhrs.handle(req, res, config, next)

  app.get "/__root/*", (req, res, next) ->
    file = path.join(config.projectRoot, req.params[0])

    res.sendFile(file, {etag: false})

  ## we've namespaced the initial sending down of our cypress
  ## app as '__'  this route shouldn't ever be used by servers
  ## and therefore should not conflict
  ## ---
  ## TODO: we should additionally send config for the socket.io route, etc
  ## and any other __cypress namespaced files so that the runner does
  ## not have to be aware of anything
  la(check.unemptyString(config.clientRoute), "missing client route in config", config)

  app.get config.clientRoute, (req, res) ->
    debug("Serving Cypress front-end by requested URL:", req.url)

    runner.serve(req, res, {
      config,
      project,
      getRemoteState,
    })

  app.all "*", (req, res, next) ->
    proxy.handle(req, res, config, getRemoteState, request)

  ## when we experience uncaught errors
  ## during routing just log them out to
  ## the console and send 500 status
  ## and report to raygun (in production)
  app.use (err, req, res, next) ->
    console.log err.stack

    res.set("x-cypress-error", err.message)
    res.set("x-cypress-stack", JSON.stringify(err.stack))
    res.sendStatus(500)
