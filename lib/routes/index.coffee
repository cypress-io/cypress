_           = require 'underscore'
glob        = require 'glob'
path        = require 'path'

convertToAbsolutePath = (files) ->
  ## make sure its an array and remap to an absolute path
  files = _([files]).flatten()
  files.map (files) ->
    if /^\//.test(files) then files else "/" + files

getTestFiles = ->
  testFolderPath = path.join(
    app.get("cypress").projectRoot,
    app.get("cypress").testFolder
  )

  ## grab all the js and coffee files
  files = glob.sync "#{testFolderPath}/**/*.+(js|coffee)"

  ## slice off the testFolder directory(ies) (which is our test folder)
  testFolderLength = testFolderPath.split("/").length

  files = _(files).map (file) -> {name: file.split("/").slice(testFolderLength).join("/")}
  files.path = testFolderPath
  files

getSpecs = (test) ->
  ## grab all of the specs if this is ci
  if test is "ci"
    specs = _(getTestFiles()).pluck "name"
  else
    ## return just this single test
    specs = [test]

  ## return the specs prefixed with /tests/
  _(specs).map (spec) -> "/tests/#{spec}"

getStylesheets = ->
  convertToAbsolutePath app.get("cypress").stylesheets

getJavascripts = ->
  convertToAbsolutePath app.get("cypress").javascripts

getUtilities = ->
  utils = ["iframe"]
  # utils = ["jquery", "iframe"]

  ## push sinon into utilities if enabled
  utils.push "sinon" if app.get("cypress").sinon
  # utils.push "chai-jquery" if app.get("cypress")["chai-jquery"]

  ## i believe fixtures can be moved to the parent since
  ## its not actually mutated within the specs
  utils.push "fixtures" if app.get("cypress").fixtures

  utils.map (util) -> "/eclectus/js/#{util}.js"

module.exports = (app) ->
  controllers = require('../controllers')(app)

  ## routing for the actual specs which are processed automatically
  ## this could be just a regular .js file or a .coffee file
  app.get "/tests/*", (req, res, next) ->
    test = req.params[0]

    controllers.specProcessor.handle(app, test, req, res, next)

  app.get "/files", (req, res) ->
    files = getTestFiles()
    res.set "X-Files-Path", files.path
    res.json files

  ## routing for the dynamic iframe html
  app.get "/iframes/*", (req, res) ->

    test = req.params[0]

    filePath = path.join(__dirname, "../", "../",  "app/html/empty_inject.html")

    res.render filePath, {
      title:        req.params.test
      stylesheets:  getStylesheets()
      javascripts:  getJavascripts()
      utilities:    getUtilities()
      specs:        getSpecs(test)
    }


  app.get "/__remote/*", (req, res, next) ->
    ## might want to use cookies here instead of the query string
    if req.query.__initial
      controllers.remoteInitial.handle(req, res, {
        inject: "<script type='text/javascript' src='/eclectus/js/sinon.js'></script>"
      })
    else
      controllers.remoteProxy.handle(req, res, next)

  ## we've namespaced the initial sending down of our cypress
  ## app as '__'  this route shouldn't ever be used by servers
  ## and therefore should not conflict
  app.get "/__", (req, res) ->
    req.session.host = req.get("host")

    res.render path.join(__dirname, "../", "public", "index.html"), {
      config: JSON.stringify(app.get("cypress"))
    }

  ## serve the real cypress JS app when we're at root
  app.get "/", (req, res, next) ->
    ## if we dont have a req.session that means we're initially
    ## requesting the cypress app and we need to redirect to the
    ## root path that serves the app
    if not req.session.remote
      res.redirect("/__/")
    else
      ## else pass through as normal
      controllers.remoteProxy.handle(req, res, next)

  ## this serves the html file which is stripped down
  ## to generate the id's for the test files
  app.get "/id_generator", (req, res, next) ->
    res.sendFile path.join(__dirname, "../", "public", "id_generator.html"), {etag: false}

  ## unfound paths we assume we want to pass on through
  ## to the origin proxyUrl
  app.all "*", (req, res, next) ->
    controllers.remoteProxy.handle(req, res, next)
