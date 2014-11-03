express     = require("express")
http        = require("http")
path        = require("path")
fs          = require("fs")
hbs         = require("hbs")
glob        = require("glob")
_           = require("underscore")
_.str       = require("underscore.string")
chokidar    = require("chokidar")
minimist    = require("minimist")
Domain      = require("domain")
idGenerator = require("./id_generator.coffee")
uuid        = require("node-uuid")

argv = minimist(process.argv.slice(2), boolean: true)

controllers =
  RemoteLoader: new (require('./controllers/remote_loader'))().handle
  RemoteProxy: new (require('./controllers/remote_proxy'))().handle
  SpecProcessor: new (require('./controllers/spec_processor'))().handle

_.mixin _.str.exports()

global.app  = express()
server      = http.Server(app)
io          = require("socket.io")(server)

## set the eclectus config from the eclectus.json file
app.set "eclectus", JSON.parse(fs.readFileSync("eclectus.json", encoding: "utf8")).eclectus

## set the locals up here so we dont have to process them on every request
{ testFiles, testFolder } = app.get("eclectus")

testFiles = new RegExp(testFiles)

## all environments
app.set 'port', argv.port or app.get("eclectus").port or 3000

app.set "view engine", "html"
app.engine "html", hbs.__express

app.use require("compression")()
app.use require("morgan")("dev")
app.use require("body-parser").json()
app.use require("method-override")()
app.use(require('express-session')({secret: "marionette is cool"}))

convertToAbsolutePath = (files) ->
  ## make sure its an array and remap to an absolute path
  files = _([files]).flatten()
  files.map (files) ->
    if /^\//.test(files) then files else "/" + files

getFiles = (pattern) ->
  glob.sync pattern

getStylesheets = ->
  convertToAbsolutePath app.get("eclectus").stylesheets

getJavascripts = ->
  convertToAbsolutePath app.get("eclectus").javascripts

getUtilities = ->
  utils = ["iframe"]
  # utils = ["jquery", "iframe"]

  ## push sinon into utilities if enabled
  utils.push "sinon" if app.get("eclectus").sinon
  # utils.push "chai-jquery" if app.get("eclectus")["chai-jquery"]

  ## i believe fixtures can be moved to the parent since
  ## its not actually mutated within the specs
  utils.push "fixtures" if app.get("eclectus").fixtures

  utils.map (util) -> "/eclectus/js/#{util}.js"

getTestFiles = ->
  ## grab all the js and coffee files
  files = glob.sync "#{testFolder}/**/*.+(js|coffee)"

  ## slice off the testFolder directory(ies) (which is our test folder)
  testFolderLength = testFolder.split("/").length
  _(files).map (file) -> {name: file.split("/").slice(testFolderLength).join("/")}

io.on "connection", (socket) ->
  console.log "socket connected"

  socket.on "generate:test:id", (data, fn) ->
    console.log "generate:test:id", data
    idGenerator.getId data, (id) -> fn(id)

  socket.on "finished:generating:ids:for:test", (strippedPath) ->
    console.log "finished:generating:ids:for:test", strippedPath
    io.emit "test:changed", file: strippedPath

  _.each "load:iframe command:add runner:start runner:end before:run before:add after:add suite:add suite:start suite:stop test test:add test:start test:end after:run test:results:ready exclusive:test".split(" "), (event) ->
    socket.on event, (args...) ->
      args = _.chain(args).compact().reject(_.isFunction).value()
      io.emit event, args...

  ## when we're told to run:sauce we receive
  ## the spec and callback with the name of our
  ## sauce labs job
  ## we'll embed some additional meta data into
  ## the job name
  socket.on "run:sauce", (spec, fn) ->
    ## this will be used to group jobs
    ## together for the runs related to 1
    ## spec
    batchId = Date.now()

    jobName = testFolder + "/" + spec
    fn(jobName, batchId)

    normalizeJobObject = (job, name, batchId, id) ->
      job.browser = {
        iexplore: "ie"
        googlechrome: "chrome"
        firefox: "firefox"
        safari: "safari"
      }[job.browser]

      job.browserVersion  = job.browser_short_version
      job.name            = name
      job.batchId         = batchId
      job.id              = id

      delete job.browser_short_version

      job

    jobs = [
      { os: "Windows 8", browser: "iexplore",     browser_short_version: 11 }
      { os: "Windows 7", browser: "iexplore",     browser_short_version: 10 }
      { os: "Linux",     browser: "googlechrome", browser_short_version: 35 }
      { os: "Linux",     browser: "firefox",      browser_short_version: 32 }
      { os: "Mac 10.8",  browser: "safari",       browser_short_version: 6 }
    ]

    ## simulate jobs being added into sauce labs
    _(jobs.length).times ->
      _.delay ->
        ## simulate grabbing a random job and getting a unique id
        guid = uuid.v4()
        job = jobs.splice _.random(0, jobs.length - 1), 1
        socket.emit "sauce:job:start", normalizeJobObject(job[0], jobName, batchId, guid)

        ## emit the 'sauce:job:end' event to simulate
        ## what its like finishing a job
        _.delay ->
          socket.emit "sauce:job:end", guid
        , _.random(1, 5) * 1000

      , _.random(1, 3) * 1000

    # browsers = ["chrome", "firefox"]

    # runs = _.reduce browsers, (memo, value) ->
    #   memo.push $.Deferred()
    #   memo
    # , []

    # _.each browsers, (browser, index) ->
    #   run.always (result) ->
    #     socket.emit "sauce:run:finished", result

    #   sauce.run("0.0.0.0", app.get("port"), spec, browser, runs[index])

    # $.when(runs...).always ->
    #   socket.emit "sauce:all:runs:finished", runs

watchTestFiles = chokidar.watch testFolder, ignored: (path, stats) ->
  ## this fn gets called twice, once with the directory
  ## which does not have a stats argument
  ## we always return false to include directories
  ## until we implement ignoring specific directories
  return false if fs.statSync(path).isDirectory()

  ## else if this is a file make sure its ignored if its not
  ## a js or coffee files
  not /\.(js|coffee)$/.test path

watchTestFiles.on "change", (filepath, stats) ->
  ## simple solution for preventing firing test:changed events
  ## when we are making modifications to our own files
  return if app.enabled("editFileMode")

  ## strip out our testFolder path from the filepath, and any leading forward slashes
  strippedPath  = filepath.replace(testFolder, "").replace(/^\/+/, "")#split("/")

  console.log "changed", filepath, strippedPath
  io.emit "generate:ids:for:test", filepath, strippedPath

watchCssFiles = chokidar.watch path.join(__dirname, "public", "css"), ignored: (path, stats) ->
  return false if fs.statSync(path).isDirectory()

  not /\.css$/.test path

# watchCssFiles.on "add", (path) -> console.log "added css:", path
watchCssFiles.on "change", (filepath, stats) ->
  filepath = path.basename(filepath)
  io.emit "eclectus:css:changed", file: filepath

getSpecs = (test) ->
  ## grab all of the specs if this is ci
  if test is "ci"
    specs = _(getTestFiles()).pluck "name"
  else
    ## return just this single test
    specs = [test]

  ## return the specs prefixed with /tests/
  _(specs).map (spec) -> "/tests/#{spec}"

## serve static file from public when route is /eclectus
## this is to namespace the static eclectus files away from
## the real application
app.use "/eclectus", express.static(__dirname + "/public")

## routing for the actual specs which are processed automatically
## this could be just a regular .js file or a .coffee file
app.get "/tests/*", (req, res, next) ->
  test = req.params[0]

  controllers.SpecProcessor.apply(
    this, [{
      spec: test,
      testFolder: testFolder
    }].concat(arguments...)
  )

app.get "/files", (req, res) ->
  res.json getTestFiles()

## routing for the dynamic iframe html
app.get "/iframes/*", (req, res) ->

  test = req.params[0]

  ## renders the defaultPage file if it is truthy in the config
  # if app.get("eclectus").defaultPage
    # filePath = path.join(process.cwd(), app.get("eclectus").defaultPage)
  # else
  filePath = path.join(__dirname, "../", "app/html/empty_inject.html")

  res.render filePath, {
    title:        req.params.test
    stylesheets:  getStylesheets()
    javascripts:  getJavascripts()
    utilities:    getUtilities()
    specs:        getSpecs(test)
  }

# app.get "/external", (req, res) ->
#   # req.session.proxyUrl = req.query.url

#   controllers.RemoteLoader(req, res, {
#     inject: "<script src='/eclectus/js/sinon.js'></script>"
#   })

app.get "/__remote/*", (req, res, next) ->
  ## might want to use cookies here instead of the query string

  if req.query.__initial
    controllers.RemoteLoader(req, res, {
      inject: "<script type='text/javascript' src='/eclectus/js/sinon.js'></script>"
    })
  else
    controllers.RemoteProxy.apply(this, arguments)

## serve the real eclectus JS app when we're at root
app.get "/", (req, res) ->
  res.render path.join(__dirname, "public", "index.html"), {
    config: JSON.stringify(app.get("eclectus"))
  }

## this serves the html file which is stripped down
## to generate the id's for the test files
app.get "/id_generator", (req, res) ->
  res.sendFile path.join(__dirname, "public", "id_generator.html")

## unfound paths we assume we want to pass on through
## to the origin proxyUrl
app.all "*", controllers.RemoteProxy

## errorhandler
app.use require("errorhandler")()

server.listen app.get("port"), ->
  console.log 'Express server listening on port ' + app.get('port')

  ## open phantom if ids are true (which they are by default)
  idGenerator.openPhantom() if argv.ids
