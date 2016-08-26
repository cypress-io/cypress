require("../spec_helper")

_        = require("lodash")
http     = require("http")
morgan   = require("morgan")
parser   = require("cookie-parser")
express  = require("express")
Promise  = require("bluebird")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")

app = express()

srv = http.Server(app)

app.use(morgan("dev"))
app.use(parser())

app.get "/foo", (req, res) ->
  console.log "cookies", req.cookies
  res.send(req.cookies)

startServer = ->
  new Promise (resolve) ->
    srv.listen 2121, ->
      console.log "listening on 2121"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe.only "e2e cookies", ->
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

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/cookies_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
