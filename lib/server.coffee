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
mkdirp    = require('mkdirp')
url       = require("url")

_.mixin _.str.exports()

app       = express()
server    = http.Server(app)
io        = require("socket.io")(server)

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

escapeRegExp = (str) ->
  str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"

getRandom = (alphabet) ->
  index = Math.floor(Math.random() * alphabet.length)
  alphabet[index]

generateId = ->
  ids = _(3).times -> getRandom(alphabet)
  ids.join("")

appendTestId = (spec, title, id) ->
  specFile = path.join(testFolder, spec)
  contents = fs.readFileSync specFile, "utf8"
  re = new RegExp "['\"](" + escapeRegExp(title) + ")['\"]"

  # ## if the string is found and it doesnt have an id
  matches = re.exec contents

  ## matches[1] will be the captured group which is the title
  if matches
    ## position is the string index where we first find the capture
    ## group and include its length, so we insert right after it
    position = matches.index + matches[1].length + 1
    contents = _(contents).insert position, " [#{id}]"

    ## enable editFileMode which prevents us from sending out test:changed events
    app.enable("editFileMode")

    ## write the actual contents to the file
    fs.writeFileSync specFile, contents

    ## remove the editFileMode so we emit file changes again
    ## if we're still in edit file mode then wait 1 second and disable it
    ## chokidar doesnt instantly see file changes so we have to wait
    _.delay ->
      app.disable("editFileMode")
    , 1000

io.on "connection", (socket) ->
  socket.on "generate:test:id", (data, fn) ->
    { spec, title } = data

    id = generateId()

    appendTestId(spec, title, id)
    fn(id)

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

  # watchTestFiles.on "add", (path) -> console.log "added js:", path
  watchTestFiles.on "change", (filepath, stats) ->
    # contents    = fs.readFileSync filepath, "utf8"
    # newFilePath = path.join process.cwd(), filepath#.replace("tests", "compiled")
    # mkdirp.sync path.dirname(newFilePath)
    # fs.writeFileSync newFilePath, contents + "\n  it 'tests', ->"

    ## simple solution for preventing firing test:changed events
    ## when we are making modifications to our own files
    return if app.enabled("editFileMode")

    ## strip out our testFolder path from the filepath, and any leading forward slashes
    filepath  = filepath.replace(testFolder, "").replace(/^\/+/, "")#split("/")

    socket.emit "test:changed", file: filepath

  watchCssFiles = chokidar.watch path.join(__dirname, "public", "css"), ignored: (path, stats) ->
    return false if fs.statSync(path).isDirectory()

    not /\.css$/.test path

  # watchCssFiles.on "add", (path) -> console.log "added css:", path
  watchCssFiles.on "change", (filepath, stats) ->
    filepath = path.basename(filepath)
    socket.emit "eclectus:css:changed", file: filepath

  # ## watch js/coffee files for changes
  # gazeTestFiles = new Gaze
  # gazeTestFiles.add "#{testFolder}/**/*.+(js|coffee)"

  # gazeTestFiles.watched (err, watched) ->
  #   console.log "gazeTestFiles", watched

  # gazeTestFiles.on "changed", (filepath) ->
  #   ## split the path into an array
  #   ## find the index of our testFolder
  #   ## grab all the rest of the elements
  #   ## past this testFolder
  #   filepath  = filepath.split("/")
  #   index = filepath.indexOf(testFolder)
  #   filepath  = _(filepath).rest(index + 1).join("/")
  #   socket.emit "test:changed", file: filepath

  # ## only do this in development mode
  # gazeCss = new Gaze path.join(__dirname, "public", "css", "*.css")

  # gazeCss.watched (err, watched) ->
  #   console.log "gazeCss", watched

  # gazeCss.on "changed", (filepath) ->
  #   filepath = path.basename(filepath)
  #   socket.emit "eclectus:css:changed", file: filepath

# getSpecs = (spec) ->
  ## grab all the files from our test folder
  # _(files).filter (file) -> testFiles.match file
  # files = getFiles("#{testFolder}/**/#{spec}")

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

app.get "/files", (req, res) ->
  res.json getTestFiles()

## routing for the dynamic iframe html
app.get "/iframes/*", (req, res) ->

  test = req.params[0]

  ## renders the testHtml file defined in the config
  res.render path.join(process.cwd(), app.get("eclectus").testHtml), {
    title:        req.params.test
    stylesheets:  getStylesheets()
    javascripts:  getJavascripts()
    utilities:    getUtilities()
    spec:         "/tests/#{test}"
  }

## serve the real eclectus JS app when we're at root
app.get "/", (req, res) ->
  res.sendFile path.join(__dirname, "public", "index.html")

## else send the file from process.cwd()
app.get "*", (req, res) ->
  ## strip off any query params from our req's url
  baseUrl = url.parse(req.url).pathname

  args = _.compact([process.cwd(), app.get("eclectus").rootFolder, baseUrl])
  res.sendFile path.join args...

## errorhandler
app.use require("errorhandler")()

server.listen app.get("port"), ->
  console.log 'Express server listening on port ' + app.get('port')

console.log(process.cwd())
console.log(__dirname)