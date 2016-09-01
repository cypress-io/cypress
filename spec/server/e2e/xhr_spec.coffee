require("../spec_helper")

http       = require("http")
morgan     = require("morgan")
express    = require("express")
bodyParser = require("body-parser")
Fixtures   = require("../helpers/fixtures")
user       = require("#{root}lib/user")
cypress    = require("#{root}lib/cypress")
Project    = require("#{root}lib/project")

app = express()

srv = http.Server(app)

app.use(morgan("dev"))
app.use(bodyParser.json())

app.get "/", (req, res) ->
  res.send("<html>hi there</html>")

app.post "/login", (req, res) ->
  ## respond with JSON with exactly what the
  ## request body was and all of the request headers
  res.json({
    body: req.body
    headers: req.headers
  })

app.post "/html", (req, res) ->
  res.json({content: "<html>content</html>"})

startServer = ->
  new Promise (resolve) ->
    srv.listen 1919, ->
      console.log "listening on 1919"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e xhr", ->
  beforeEach ->
    Fixtures.scaffold()

    @e2ePath = Fixtures.projectPath("e2e")

    @sandbox.stub(process, "exit")

    user.set({name: "brian", session_token: "session-123"})
    .then =>
      Project.add(@e2ePath)
    .then =>
      startServer()

  afterEach ->
    Fixtures.remove()

    stopServer()

  it "passes", ->
    @timeout(20000)

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/xhr_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
