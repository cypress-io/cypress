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
    srv.listen 3636, ->
      console.log "listening on 3636"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e images", ->
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

    ## this tests that images are correctly proxied and that we are not
    ## accidentally modifying their bytes in the stream

    cypress.start(["--run-project=#{e2ePath}", "--spec=cypress/integration/images_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)