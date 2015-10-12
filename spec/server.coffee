express   = require("express")
http      = require("http")
path      = require("path")
fs        = require("fs")
hbs       = require("hbs")
glob      = require("glob")
coffee    = require("coffee-script")
str       = require("string-to-stream")
Promise   = require("bluebird")
_         = require("underscore")

app       = express()
server    = http.Server(app)

app.set 'port', "3500"

app.set "view engine", "html"
app.engine "html", hbs.__express

app.use require("compression")()
app.use require("morgan")(format: "dev")
app.use require("body-parser")()
app.use require("method-override")()

removeExtension = (str) ->
  str.split(".").slice(0, -1).join(".")

getSpecPath = (pathName) ->
  if /all_specs/.test(pathName) then getAllSpecs(false) else [pathName.replace(/^\//, "")]

getAllSpecs = (allSpecs = true) ->
  specs = glob.sync "client/**/*.coffee", cwd: __dirname
  specs.unshift "client/all_specs.coffee" if allSpecs
  _.chain(specs)
    ## remove the spec helper file
    .reject (spec) -> /spec_helper/.test(spec)
    .map (spec) ->
      ## replace client/whatevs.coffee -> specs/whatevs.coffee
      spec = spec.split("/")
      spec.splice(0, 1, "specs")

      ## strip off the extension
      removeExtension spec.join("/")
    .value()

getSpec = (spec) ->
  spec = removeExtension(spec) + ".coffee"
  file = fs.readFileSync path.join(__dirname, "client", spec), "utf8"
  coffee.compile(file)

app.get "/specs/*", (req, res) ->
  spec = req.params[0]

  switch
    when /\.js$/.test spec
      res.type "js"
      res.send getSpec(spec)
    else
      res.render path.join(__dirname, "views", "spec.html"), {
        specs: getSpecPath(req.path)
      }

app.get "/timeout", (req, res) ->
  setTimeout ->
    res.send "<html></html>"
  , req.query.ms

app.get "/bower_components/*", (req, res) ->
  res.sendFile path.join("bower_components", req.params[0]),
    root: path.join(__dirname, "..")

app.get "/lib/*", (req, res) ->
  res.sendFile path.join("lib", req.params[0]),
    root: path.join(__dirname, "..")

app.get "/fixtures/*", (req, res) ->
  res.sendFile "fixtures/#{req.params[0]}",
    root: __dirname

app.all "/__cypress/xhrs/*", (req, res, next) ->
  respond = ->
    res.type("json").status(req.get("x-cypress-status"))

    ## figure out the stream interface and pipe these
    ## chunks to the response
    str(req.get("x-cypress-response")).pipe(res)

  delay = ~~req.get("x-cypress-delay")

  if delay > 0
    Promise.delay(delay).then(respond)
  else
    respond()

app.get "/", (req, res) ->
  res.render path.join(__dirname, "views", "index.html"), {
    specs: getAllSpecs()
  }

app.get "*", (req, res) ->
  file = req.params[0].replace(/\/+$/, "")
  res.sendFile file,
    root: __dirname

## errorhandler
app.use require("errorhandler")()

server.listen app.get("port"), ->
  console.log 'Express server listening on port ' + app.get('port')