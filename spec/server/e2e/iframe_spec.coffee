require("../spec_helper")

path       = require("path")
http       = require("http")
morgan     = require("morgan")
express    = require("express")
bodyParser = require("body-parser")
Fixtures   = require("../helpers/fixtures")
user       = require("#{root}lib/user")
cypress    = require("#{root}lib/cypress")
Project    = require("#{root}lib/project")

e2ePath = Fixtures.projectPath("e2e")

app = express()

srv = http.Server(app)

app.use(morgan("dev"))
app.use(bodyParser.json())

app.get "/", (req, res) ->
  res.send("<html>outer content<iframe src='/iframe'></html>")

app.get "/iframe", (req, res) ->
  ## send the iframe contents
  res.sendFile(path.join(e2ePath, "static", "iframe", "index.html"))

startServer = ->
  new Promise (resolve) ->
    srv.listen 1616, ->
      console.log "listening on 1616"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e iframes", ->
  beforeEach ->
    Fixtures.scaffold()

    @sandbox.stub(process, "exit")

    user.set({name: "brian", session_token: "session-123"})
    .then =>
      Project.add(e2ePath)
    .then =>
      startServer()

  afterEach ->
    Fixtures.remove()

    stopServer()

  it "passes", ->
    @timeout(30000)

    cypress.start(["--run-project=#{e2ePath}", "--spec=cypress/integration/iframe_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
