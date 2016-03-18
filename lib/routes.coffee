path        = require("path")
CacheBuster = require("./util/cache_buster")
cwd         = require("./cwd")

module.exports = (app) ->
  controllers = require('./controllers')(app)

  ## routing for the actual specs which are processed automatically
  ## this could be just a regular .js file or a .coffee file
  app.get "/__cypress/tests", (req, res, next) ->
    ## slice out the cache buster
    test = CacheBuster.strip(req.query.p)

    controllers.specProcessor.handle(test, req, res, next)

  ## routing for /files JSON endpoint
  app.get "/__cypress/files", (req, res) ->
    controllers.files.handleFiles(req, res)

  app.get "/__cypress/builds", (req, res, next) ->
    controllers.builds.handleBuilds(req, res, next)

  ## routing for the dynamic iframe html
  app.get "/__cypress/iframes/*", (req, res) ->
    controllers.files.handleIframe(req, res)

  app.all "/__cypress/xhrs/*", (req, res, next) ->
    controllers.xhrs.handleXhr(req, res, next)

  app.get "/__root/*", (req, res, next) ->
    file = path.join(app.get("cypress").projectRoot, req.params[0])

    res.sendFile(file, {etag: false})

  ## we've namespaced the initial sending down of our cypress
  ## app as '__'  this route shouldn't ever be used by servers
  ## and therefore should not conflict
  app.get app.get("cypress").clientRoute, (req, res) ->
    res.render cwd("lib", "public", "index.html"), {
      config: JSON.stringify(app.get("cypress"))
    }

  app.all "*", (req, res, next) ->
    controllers.proxy.handle(req, res, next)