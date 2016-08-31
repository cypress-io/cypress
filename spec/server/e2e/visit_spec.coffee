require("../spec_helper")

http     = require("http")
morgan   = require("morgan")
express  = require("express")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")

e2ePath = Fixtures.projectPath("e2e")

app = express()

srv = http.Server(app)

app.use(morgan("dev"))

app.use(express.static(e2ePath))

startServer = ->
  new Promise (resolve) ->
    srv.listen 3434, ->
      console.log "listening on 3434"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e visit", ->
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
    @timeout(20000)

    ## this tests that hashes are applied during a visit
    ## which forces the browser to scroll to the div
    ## additionally this tests that jquery.js is not truncated
    ## due to __cypress.initial cookies not being cleared by
    ## the hash.html response

    ## additionally this tests that xhr request headers + body
    ## can reach the backend without being modified or changed
    ## by the cypress proxy in any way

    cypress.start(["--run-project=#{e2ePath}", "--spec=cypress/integration/visit_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)