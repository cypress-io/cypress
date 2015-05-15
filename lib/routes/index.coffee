path        = require 'path'

module.exports = (app) ->
  controllers = require('../controllers')(app)

  ## routing for the actual specs which are processed automatically
  ## this could be just a regular .js file or a .coffee file
  app.get "/__cypress/tests", (req, res, next) ->
    test = req.query.p

    controllers.specProcessor.handle(test, req, res, next)

  ## routing for /files JSON endpoint
  app.get "/__cypress/files", (req, res) ->
    controllers.files.handleFiles(req, res)

  ## routing for the dynamic iframe html
  app.get "/__cypress/iframes/*", (req, res) ->
    controllers.files.handleIframe(req, res)

  ## this serves the html file which is stripped down
  ## to generate the id's for the test files
  app.get "/__cypress/id_generator", (req, res, next) ->
    res.sendFile path.join(process.cwd(), "lib", "public", "id_generator.html"), {etag: false}

  ## we've namespaced the initial sending down of our cypress
  ## app as '__'  this route shouldn't ever be used by servers
  ## and therefore should not conflict
  app.get app.get("cypress").clientRoute, (req, res) ->
    res.render path.join(process.cwd(), "lib", "public", "index.html"), {
      config: JSON.stringify(app.get("cypress"))
    }

  ## serve the real cypress JS app when we're at root
  app.get "/", (req, res, next) ->
    ## if we dont have a req.session that means we're initially
    ## requesting the cypress app and we need to redirect to the
    ## root path that serves the app
    if not req.cookies["__cypress.remoteHost"]
      res.redirect app.get("cypress").clientRoute
    else
      ## send it to the catch all * route!
      next("route")

  ## unfound paths we assume we want to pass on through
  ## to the origin proxyUrl
  app.all "*", (req, res, next) ->
    controllers.remoteInitial.handle(req, res, next)