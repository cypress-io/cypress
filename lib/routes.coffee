path        = require("path")
CacheBuster = require("./util/cache_buster")
cwd         = require("./cwd")
logger      = require("./logger")
spec        = require("./controllers/spec_processor")
xhrs        = require("./controllers/xhrs")
files       = require("./controllers/files")
proxy       = require("./controllers/proxy")
builds      = require("./controllers/builds")

module.exports = (app, config) ->
  ## routing for the actual specs which are processed automatically
  ## this could be just a regular .js file or a .coffee file
  app.get "/__cypress/tests", (req, res, next) ->
    ## slice out the cache buster
    test = CacheBuster.strip(req.query.p)

    spec.handle(test, req, res, config, next)

  ## routing for /files JSON endpoint
  app.get "/__cypress/files", (req, res) ->
    files.handleFiles(req, res, config)

  ## routing for the dynamic iframe html
  app.get "/__cypress/iframes/*", (req, res) ->
    files.handleIframe(req, res, config)

  app.get "/__cypress/builds", (req, res, next) ->
    builds.handleBuilds(req, res, config, next)

  app.all "/__cypress/xhrs/*", (req, res, next) ->
    xhrs.handle(req, res, config, next)

  app.get "/__root/*", (req, res, next) ->
    file = path.join(config.projectRoot, req.params[0])

    res.sendFile(file, {etag: false})

  ## we've namespaced the initial sending down of our cypress
  ## app as '__'  this route shouldn't ever be used by servers
  ## and therefore should not conflict
  app.get config.clientRoute, (req, res) ->
    res.render cwd("lib", "public", "index.html"), {
      config: JSON.stringify(config)
    }

  app.all "*", (req, res, next) ->
    proxy.handle(req, res, config, app, next)

  ## when we experience uncaught errors
  ## during routing just log them out to
  ## the console and send 500 status
  ## and report to raygun (in production)
  app.use (err, req, res, next) ->
    console.log err.stack

    res.set("x-cypress-error", err.message)
    res.set("x-cypress-stack", err.stack.replace("\n", "\\n"))
    res.sendStatus(500)
