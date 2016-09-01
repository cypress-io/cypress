require("../spec_helper")

http     = require("http")
morgan   = require("morgan")
express  = require("express")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")

app = express()

srv = http.Server(app)

app.use(morgan("dev"))

app.get "/first", (req, res) ->
  res.send("<html><h1>first</h1><a href='/second'>second</a></html>")

app.get "/second", (req, res) ->
  res.send("<html><h1>second</h1></html>")

startServer = ->
  new Promise (resolve) ->
    srv.listen 1818, ->
      console.log "listening on 1818"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e go", ->
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
    @timeout(30000)

    ## this tests that history changes work as intended
    ## there have been regressions in electron which would
    ## otherwise cause these tests to fail

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/go_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
