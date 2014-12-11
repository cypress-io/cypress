express     = require 'express'
http        = require 'http'
path        = require 'path'
fs          = require 'fs'
hbs         = require 'hbs'
_           = require 'underscore'
_.str       = require 'underscore.string'
chokidar    = require 'chokidar'
minimist    = require 'minimist'
Domain      = require 'domain'
idGenerator = require './id_generator.coffee'
uuid        = require 'node-uuid'
sauce       = require './sauce/sauce.coffee'
jQuery      = require 'jquery-deferred'

argv = minimist(process.argv.slice(2), boolean: true)

_.mixin _.str.exports()

global.app  = express()
server      = http.createServer(app)
io          = require("socket.io")(server, {path: "/__socket.io"})

getEclectusJson = ->
  obj = JSON.parse(fs.readFileSync("eclectus.json", encoding: "utf8")).eclectus

  if url = obj.rootUrl
    ## always strip trailing slashes
    obj.rootUrl = _.rtrim(url, "/")

  ## commandTimeout should be in the eclectus.json file
  ## since it has a significant impact on the tests
  ## passing or failing

  _.defaults obj,
    commandTimeout: 5000
    port: 3000

## set the eclectus config from the eclectus.json file
app.set "eclectus", getEclectusJson()

## set the locals up here so we dont have to process them on every request
{ testFiles, testFolder } = app.get("eclectus")

testFiles = new RegExp(testFiles)

## all environments
app.set 'port', argv.port or app.get("eclectus").port

app.set "view engine", "html"
app.engine "html", hbs.__express

app.use require("cookie-parser")()
app.use require("compression")()
app.use require("morgan")("dev")
app.use require("body-parser").json()
app.use require("method-override")()
app.use require('express-session')(
  secret: "marionette is cool"
  saveUninitialized: true
  resave: true
  name: "__cypress.sid"
)

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
    ## spec by setting custom-data on the job object
    batchId = Date.now()

    jobName = testFolder + "/" + spec
    fn(jobName, batchId)

    ## need to handle platform/browser/version incompatible configurations
    ## and throw our own error
    ## https://saucelabs.com/platforms/webdriver
    jobs = [
      { platform: "Windows 8.1", browser: "internet explorer",  version: 11 }
      { platform: "Windows 7",   browser: "internet explorer",  version: 10 }
      { platform: "Linux",       browser: "chrome",             version: 37 }
      { platform: "Linux",       browser: "firefox",            version: 33 }
      { platform: "OS X 10.9",   browser: "safari",             version: 7 }
    ]

    normalizeJobObject = (obj) ->
      obj = _(obj).clone()

      obj.browser = {
        "internet explorer": "ie"
      }[obj.browserName] or obj.browserName

      obj.os = obj.platform

      _(obj).pick "name", "browser", "version", "os", "batchId", "guid"

    _.each jobs, (job) ->
      options =
        host:        "0.0.0.0"
        port:        app.get("port")
        name:        jobName
        batchId:     batchId
        guid:        uuid.v4()
        browserName: job.browser
        version:     job.version
        platform:    job.platform

      clientObj = normalizeJobObject(options)
      socket.emit "sauce:job:create", clientObj

      df = jQuery.Deferred()

      df.progress (sessionID) ->
        ## pass up the sessionID to the previous client obj by its guid
        socket.emit "sauce:job:start", clientObj.guid, sessionID

      df.fail (err) ->
        socket.emit "sauce:job:fail", clientObj.guid, err

      df.done (sessionID, runningTime, passed) ->
        socket.emit "sauce:job:done", sessionID, runningTime, passed

      sauce options, df

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

## serve static file from public when route is /eclectus
## this is to namespace the static eclectus files away from
## the real application by separating the root from the files
app.use "/eclectus", express.static(__dirname + "/public")

## errorhandler
app.use require("errorhandler")()

require('./routes')(app)

server.listen app.get("port"), ->
  console.log 'Express server listening on port ' + app.get('port')

  ## open phantom if ids are true (which they are by default)
  idGenerator.openPhantom() #if argv.ids

  require('open')("http://localhost:#{app.get('port')}") unless app.get('eclectus').preventOpen
