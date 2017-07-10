_         = require("lodash")
bodyParser = require("body-parser")
express   = require("express")
http      = require("http")
path      = require("path")
fs        = require("fs")
hbs       = require("hbs")
glob      = require("glob")
coffee    = require("../../../../coffee")
str       = require("string-to-stream")
Promise   = require("bluebird")
xhrs      = require("../../../../server/lib/controllers/xhrs")
Runner    = require("./runner")

args = require("minimist")(process.argv.slice(2))

port = 3500
app = express()
server = http.Server(app)

app.set("port", port)

app.set("view engine", "html")
app.engine "html", hbs.__express

if args.debug
  app.use(require("morgan")({ format: "dev" }))

app.use(require("cors")())
app.use(require("compression")())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(require("method-override")())

removeExtension = (str) ->
  str.split(".").slice(0, -1).join(".")

getSpecPath = (pathName) ->
  if /all_specs/.test(pathName) then getAllSpecs(false) else [pathName.replace(/^\//, "")]

getAllSpecs = (allSpecs = true) ->
  specs = glob.sync("../../!(support)/**/*.coffee", { cwd: __dirname })
  specs.unshift("specs/all_specs.coffee") if allSpecs
  _.map specs, (spec) ->
    removeExtension(spec.replace("../..", "specs"))

  ## specify which files to run
  # [
  #   "specs/unit/cy/commands/agents_spec"
  #   "specs/unit/cy/commands/assertions_spec"
  # ]

getSpec = (spec) ->
  spec = "#{removeExtension(spec)}.coffee"
  file = fs.readFileSync(path.join(__dirname, "../..", spec), "utf8")
  coffee.compile(file)

sendJs = (res, pathOrContents, isContents = false) ->
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate"
    "Pragma": "no-cache"
    "Expires": "0"
  })
  res.type("js")
  if isContents
    res.send(pathOrContents)
  else
    res.sendFile(pathOrContents)

app.get "/specs/*", (req, res) ->
  spec = req.params[0]

  if /\.js$/.test(spec)
    sendJs(res, getSpec(spec), true)
  else
    res.render(path.join(__dirname, "views/spec.html"), {
      specs: getSpecPath(req.path)
      env: JSON.stringify({
        isCi: !!process.env.CI
      })
    })

app.get "/timeout", (req, res) ->
  setTimeout ->
    res.send "<html></html>"
  , req.query.ms

app.get "/node_modules/*", (req, res) ->
  res.sendFile(path.join("node_modules", req.params[0]), {
    root: path.join(__dirname, "../../..")
  })

sendDistFile = (dir) -> (req, res) ->
  filePath = path.join(__dirname, "../../../#{dir}", req.params[0])
  if /\.js$/.test(filePath)
    sendJs(res, filePath)
  else
    res.sendFile(filePath)

app.get "/dist/*", sendDistFile("dist")
app.get "/dist-test/*", sendDistFile("dist-test")

app.get "/fixtures/*", (req, res) ->
  res.sendFile("fixtures/#{req.params[0]}", {
    root: __dirname
  })

app.get "/xml", (req, res) ->
  res.type("xml").send("<foo>bar</foo>")

app.get "/buffer", (req, res) ->
  fs.readFile path.join(__dirname, "fixtures/sample.pdf"), (err, bytes) ->
    res.type("pdf")
    res.send(bytes)

app.all "/__cypress/xhrs/*", (req, res) ->
  xhrs.handle(req, res)

app.get "/", (req, res) ->
  res.render(path.join(__dirname, "views/index.html"), {
    specs: getAllSpecs()
  })

app.get "/spec_helper.js", (req, res) ->
  sendJs(res, getSpec("support/spec_helper.coffee"), true)

app.get "*", (req, res) ->
  filePath = req.params[0].replace(/\/+$/, "")
  if /\.js$/.test filePath
    sendJs(res, path.join(__dirname, filePath))
  else
    res.sendFile(filePath, { root: __dirname })

app.use(require("errorhandler")())

server.listen app.get("port"), ->
  console.log("Express server listening on port", app.get("port"))


supportApp = express()
supportServer = http.Server(app)

supportApp.set("port", 3501)

supportApp.set("view engine", "html")
supportApp.engine "html", hbs.__express

if args.debug
  supportApp.use(require("morgan")({ format: "dev" }))

supportApp.use(require("cors")())
supportApp.use(require("compression")())
supportApp.use(bodyParser.urlencoded({ extended: false }))
supportApp.use(bodyParser.json())
supportApp.use(require("method-override")())

supportApp.get "/fixtures/*", (req, res) ->
  res.sendFile("fixtures/#{req.params[0]}", {
    root: __dirname
  })

supportApp.get "/", (req, res) ->
  res.sendFile(path.join(__dirname, "views/support.html"))

supportApp.get "*", (req, res) ->
  filePath = req.params[0].replace(/\/+$/, "")
  res.sendFile(filePath, { root: __dirname })

supportServer.listen supportApp.get("port"), ->
  console.log("Express server listening on port", supportApp.get("port"))

runner = null

module.exports = {
  runSpec: (specPath) ->
    runner?.run(specPath)

  runSpecsContinuously: ->
    runner = new Runner({ port, server })
    runner.runContinuously()

  runAllSpecsOnce: ->
    new Runner({ port, server, once: true })
    .runAllSpecsOnce(getAllSpecs(false))
    .then ({ stats, timeouts }) ->
      code = if stats.failures or timeouts.length then 1 else 0
      process.exit(code)
}
