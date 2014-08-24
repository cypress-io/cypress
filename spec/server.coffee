express   = require("express")
http      = require("http")
path      = require("path")
fs        = require("fs")
hbs       = require("hbs")
glob      = require("glob")
coffee    = require("coffee-script")
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

getAllSpecs = ->
  specs = glob.sync "tests/**/*.coffee", cwd: __dirname
  _.chain(specs)
    ## remove the spec helper file
    .reject (spec) -> /spec_helper/.test(spec)
    .map (spec) ->
      ## replace tests/whatevs.coffee -> specs/whatevs.coffee
      spec = spec.split("/")
      spec.splice(0, 1, "specs")

      ## strip off the extension
      removeExtension spec.join("/")
    .value()

getSpec = (spec) ->
  spec = removeExtension(spec) + ".coffee"
  file = fs.readFileSync path.join(__dirname, "tests", spec), "utf8"
  coffee.compile(file)

app.get "/specs/*", (req, res) ->
  spec = req.params[0]

  switch
    when /\.js$/.test spec
      res.type "js"
      res.send getSpec(spec)
    else
      res.render path.join(__dirname, "views", "spec.html"), {
        spec: req.path
      }

app.get "/bower_components/*", (req, res) ->
  res.sendFile path.join("bower_components", req.params[0]),
    root: path.join(__dirname, "..")

app.get "/lib/*", (req, res) ->
  res.sendFile path.join("lib", req.params[0]),
    root: path.join(__dirname, "..")

app.get "/fixtures/:fixture", (req, res) ->
  res.sendFile "fixtures/#{req.params.fixture}",
    root: __dirname

app.get "/", (req, res) ->
  res.render path.join(__dirname, "views", "index.html"), {
    specs: getAllSpecs()
  }

## errorhandler
app.use require("errorhandler")()

server.listen app.get("port"), ->
  console.log 'Express server listening on port ' + app.get('port')