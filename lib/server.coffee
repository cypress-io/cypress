express   = require("express")
http      = require("http")
path      = require("path")
fs        = require("fs")
hbs       = require("hbs")
glob      = require("glob")
coffee    = require("coffee-script")
_         = require("underscore")
_.str     = require("underscore.string")
chokidar  = require("chokidar")
spawn     = require("child_process").spawn
mocha     = require("./mocha.coffee")

controllers =
  RemoteLoader: new (require('./controllers/remote_loader'))().handle
  RemoteProxy: new (require('./controllers/remote_proxy'))().handle

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
app.set 'port', app.get("eclectus").port or 3000

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

getTest = (spec) ->
  filePath = path.join(testFolder, spec)
  file = fs.readFileSync(filePath, "utf8")

  return coffee.compile(file) if path.extname(spec) is ".coffee"

  return file

io.on "connection", (socket) ->
  #, ignoreInitial: true
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

    mocha.generateIds filepath, strippedPath, app, ->
      ## for some reason sometimes socket.io isnt emitting
      ## the test:changed event
      _.defer ->
        console.log "test:changed", filepath
        socket.emit "test:changed", file: strippedPath

  watchCssFiles = chokidar.watch path.join(__dirname, "public", "css"), ignored: (path, stats) ->
    return false if fs.statSync(path).isDirectory()

    not /\.css$/.test path

  # watchCssFiles.on "add", (path) -> console.log "added css:", path
  watchCssFiles.on "change", (filepath, stats) ->
    filepath = path.basename(filepath)
    socket.emit "eclectus:css:changed", file: filepath

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
app.get "/tests/*", (req, res) ->
  test = req.params[0]

  res.type "js"
  res.send getTest(test)

## this serves the html file which is stripped down
## to generate the id's for the test files
app.get "/id_generator/*", (req, res) ->
  test = req.params[0]

  res.type "js"
  res.send getTest(test)

app.get "/files", (req, res) ->
  res.json getTestFiles()

## routing for the dynamic iframe html
app.get "/iframes/*", (req, res) ->

  test = req.params[0]

  ## renders the testHtml file IF it is defined in the config
  if app.get("eclectus").testHtml?
    filePath = path.join(process.cwd(), app.get("eclectus").testHtml)
  else
    filePath = path.join(__dirname, "../", "app/html/empty_inject.html")

  res.render filePath, {
    title:        req.params.test
    stylesheets:  getStylesheets()
    javascripts:  getJavascripts()
    utilities:    getUtilities()
    specs:        getSpecs(test)
  }

app.get "/external", (req, res) ->
  req.session.proxyUrl = req.query.url

  controllers.RemoteLoader(req, res, {
    inject: ""
  })

app.get "/__remote/*", (req, res) ->
  res.render path.join(__dirname, "../", "app/html/__remote.html")

## serve the real eclectus JS app when we're at root
app.get "/", (req, res) ->
  res.sendFile path.join(__dirname, "public", "index.html")

## unfound paths we assume we want to pass on through
## to the origin proxyUrl
app.get "*", controllers.RemoteProxy

## errorhandler
app.use require("errorhandler")()

server.listen app.get("port"), ->
  console.log 'Express server listening on port ' + app.get('port')