express = require("express")
http    = require("http")
path    = require("path")
fs      = require("fs")
hbs     = require("hbs")
glob    = require("glob")
coffee  = require("coffee-script")
_       = require("underscore")

app     = express()

## all environments
app.set 'port', "3000"

## set the eclectus config from the eclectus.json file
app.set "eclectus", JSON.parse(fs.readFileSync("eclectus.json", encoding: "utf8")).eclectus

## set the locals up here so we dont have to process them on every request
{ testFiles, testFolder } = app.get("eclectus")

testFiles = new RegExp(testFiles)

app.set "view engine", "html"
app.engine "html", hbs.__express

app.use require("compression")()
app.use require("morgan")(format: "dev")
app.use require("body-parser")()
app.use require("method-override")()

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
  utils = []
  # utils = ["jquery", "iframe"]

  ## push sinon into utilities if enabled
  utils.push "sinon" if app.get("eclectus").sinon

  ## i believe fixtures can be moved to the parent since
  ## its not actually mutated within the specs
  utils.push "fixtures" if app.get("eclectus").fixtures

  utils.map (util) -> "/eclectus/js/#{util}.js"

getTest = (spec) ->
  file = fs.readFileSync(spec, "utf8")

  return coffee.compile(file) if path.extname(spec) is ".coffee"

  return file

# getSpecs = (spec) ->
  ## grab all the files from our test folder
  # _(files).filter (file) -> testFiles.match file
  # files = getFiles("#{testFolder}/**/#{spec}")

## routing for the actual specs which are processed automatically
## this could be just a regular .js file or a .coffee file
app.get "/tests/:test", (req, res) ->
  res.type "js"
  res.send getTest("tests/#{req.params.test}.coffee")

## routing for the dynamic iframe html
app.get "/iframes/:test", (req, res) ->

  ## renders the testHtml file defined in the config
  res.render path.join(process.cwd(), app.get("eclectus").testHtml), {
    title:        req.params.test
    stylesheets:  getStylesheets()
    javascripts:  getJavascripts()
    utilities:    getUtilities()
    spec:         "/tests/#{req.params.test}"
  }

## serve static file from public when route is /eclectus
## this is to namespace the static eclectus files away from
## the real application
app.use "/eclectus", express.static(__dirname + "/public")

## serve the real eclectus JS app when we're at root
app.get "/", (req, res) ->
  res.sendfile path.join(__dirname, "public", "index.html")

## else send the file from process.cwd()
app.get "*", (req, res) ->
  res.sendfile path.join(process.cwd(), req.url)

## errorhandler
app.use require("errorhandler")()

http.createServer(app).listen app.get('port'), ->
  console.log 'Express server listening on port ' + app.get('port')

console.log(process.cwd())
console.log(__dirname)