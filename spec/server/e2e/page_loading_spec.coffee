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

count = 0

app.use(morgan("dev"))
app.use(bodyParser.json())

app.get "/first", (req, res) ->
  ## reset the count anytime we visit first again
  count = 0
  res.send("<html><h1>first</h1><a href='/second'>second</a></html>")

app.get "/second", (req, res) ->
  count += 1
  res.send("<html><h1>second</h1><a href='/slow'>slow</a><span id='count'>#{count}</span></html>")

app.get "/slow", (req, res) ->
  setTimeout ->
    res.send("<html><h1>slow</h1></html>")
  , 2000

app.post "/json", (req, res) ->
  res.json({
    body: req.body
  })

app.get "/html", (req, res) ->
  res.send("<html>content</html>")

startServer = ->
  new Promise (resolve) ->
    srv.listen 1717, ->
      console.log "listening on 1717"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e page_loading", ->
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

    ## this tests that __cypress.initial is set correctly whilst navigating
    ## between pages, or during cy.reload
    ## additionally this creates an edge case where after __cypress.initial is
    ## set we send an XHR which should not inject because its requested for JSON
    ## but that another XHR which is requested for html should inject

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/page_loading_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
