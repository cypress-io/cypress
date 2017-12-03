_         = require("lodash")
fs        = require("fs")
niv       = require("npm-install-version")
auth      = require("basic-auth")
bodyParser = require("body-parser")
express   = require("express")
http      = require("http")
path      = require("path")
Promise   = require("bluebird")
coffee    = require("@packages/coffee")

args = require("minimist")(process.argv.slice(2))

## make sure we have both versions of react
niv.install("react@16.0.0")
niv.install("react-dom@16.0.0")
niv.install("react@15.6.1")
niv.install("react-dom@15.6.1")

port = 3500
app = express()
server = http.Server(app)

app.set("port", port)

app.set("view engine", "html")

app.use(require("morgan")({ format: "dev" }))

app.use(require("cors")())
app.use(require("compression")())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(require("method-override")())

# rewriteFixtures = (req, res) ->
#   fixture = req.params[0]
#
#   ## if we have an html fixture
#   if (ext = path.extname(fixture)) is ".html"
#     pathToFile = path.join(__dirname, "fixtures", fixture)
#
#     ## read in the bytes
#     fs.readFileAsync(pathToFile, "utf8")
#     .then (str) ->
#       ## and rewrite them using the server's rewriter
#       res.send(rewriter.html(str, "localhost", "full"))
#   else
#     ## else just serve the file straight up
#     res.sendFile("fixtures/#{fixture}", {
#       root: __dirname
#     })

app.head "/", (req, res) ->
  res.sendStatus(200)

app.get "/timeout", (req, res) ->
  Promise
  .delay(req.query.ms ? 0)
  .then ->
    res.send "<html><body>timeout</body></html>"

app.get "/node_modules/*", (req, res) ->
  res.sendFile(path.join("node_modules", req.params[0]), {
    root: path.join(__dirname, "../..")
  })

app.get "/xml", (req, res) ->
  res.type("xml").send("<foo>bar</foo>")

app.get "/buffer", (req, res) ->
  fs.readFile path.join(__dirname, "../cypress/fixtures/sample.pdf"), (err, bytes) ->
    res.type("pdf")
    res.send(bytes)

app.get "/basic_auth", (req, res) ->
  user = auth(req)

  if user and (user.name is "cypress" and user.pass is "password123")
    res.send("<html><body>basic auth worked</body></html>")
  else
    res
    .set("WWW-Authenticate", "Basic")
    .sendStatus(401)

app.get "/status-404", (req, res) ->
  res
  .status(404)
  .send("<html><body>not found</body></html>")

app.get "/status-500", (req, res) ->
  res
  .status(500)
  .send("<html><body>server error</body></html>")

app.use(express.static(path.join(__dirname, "..", "cypress")))

app.use(require("errorhandler")())

server.listen app.get("port"), ->
  console.log("Express server listening on port", app.get("port"))

supportApp = express()
supportServer = http.Server(app)

supportApp.set("port", 3501)

supportApp.set("view engine", "html")

supportApp.use(require("morgan")({ format: "dev" }))

supportApp.use(require("cors")())
supportApp.use(require("compression")())
supportApp.use(bodyParser.urlencoded({ extended: false }))
supportApp.use(bodyParser.json())
supportApp.use(require("method-override")())

supportServer.listen supportApp.get("port"), ->
  console.log("Express server listening on port", supportApp.get("port"))
