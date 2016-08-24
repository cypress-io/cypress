require("../spec_helper")

_        = require("lodash")
fs       = require("fs-extra")
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

describe "e2e visit", ->
  beforeEach ->
    Fixtures.scaffold()

    @e2ePath = Fixtures.projectPath("e2e")

    @sandbox.stub(process, "exit")

    user.set({name: "brian", session_token: "session-123"})
    .then =>
      Project.add(@e2ePath)

  afterEach ->
    Fixtures.remove()

  it "passes", ->
    @timeout(20000)

    ## this tests that hashes are applied during a visit
    ## which forces the browser to scroll to the div
    ## additionally this tests that jquery.js is not truncated
    ## due to __cypress.initial cookies not being cleared by
    ## the hash.html response

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/visit_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
