express     = require 'express'
http        = require 'http'
path        = require 'path'
fs          = require 'fs'
hbs         = require 'hbs'
_           = require 'underscore'
_.str       = require 'underscore.string'
chokidar    = require 'chokidar'
minimist    = require 'minimist'
idGenerator = require './id_generator.coffee'

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

## serve static file from public when route is /eclectus
## this is to namespace the static eclectus files away from
## the real application by separating the root from the files
app.use "/eclectus", express.static(__dirname + "/public")

## errorhandler
app.use require("errorhandler")()

require('./socket')(io, app)
require('./routes')(app)

server.listen app.get("port"), ->
  console.log 'Express server listening on port ' + app.get('port')

  ## open phantom if ids are true (which they are by default)
  idGenerator.openPhantom() #if argv.ids

  require('open')("http://localhost:#{app.get('port')}") unless app.get('eclectus').preventOpen
