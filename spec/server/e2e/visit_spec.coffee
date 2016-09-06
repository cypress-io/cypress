require("../spec_helper")

_        = require("lodash")
cp       = require("child_process")
http     = require("http")
morgan   = require("morgan")
express  = require("express")
Promise  = require("bluebird")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")

cp = Promise.promisifyAll(cp)
e2ePath = Fixtures.projectPath("e2e")

env = _.omit(process.env, "CYPRESS_DEBUG")

app = express()

srv = http.Server(app)

app.use(morgan("dev"))

app.use(express.static(e2ePath))

app.get "/fail", (req, res) ->
  res.sendStatus(500)

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
    @timeout(30000)

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

  it "fails when network connection immediately fails", (done) ->
    @timeout(30000)

    exec = cp.exec "node index.js --run-project=#{e2ePath} --spec=cypress/integration/visit_http_network_error_failing_spec.coffee", {env: env}, (err, stdout, stderr) ->
      expect(stdout).to.include("http://localhost:16795")
      expect(stdout).to.include("We attempted to make an http request to this URL but the request immediately failed without a response.")
      expect(stdout).to.include("> Error: connect ECONNREFUSED 127.0.0.1:16795")

    exec.on "close", (code) ->
      expect(code).to.eq(1)
      done()

  it "fails when server responds with 500", (done) ->
    @timeout(30000)

    exec = cp.exec "node index.js --run-project=#{e2ePath} --spec=cypress/integration/visit_http_500_response_failing_spec.coffee", {env: env}, (err, stdout, stderr) ->
      expect(stdout).to.include("http://localhost:3434/fail")
      expect(stdout).to.include("The response we received from your web server was:")
      expect(stdout).to.include("> 500: Server Error")

    exec.on "close", (code) ->
      expect(code).to.eq(1)
      done()

  it "fails when file server responds with 404", (done) ->
    @timeout(30000)

    exec = cp.exec "node index.js --run-project=#{e2ePath} --spec=cypress/integration/visit_file_404_response_failing_spec.coffee", {env: env}, (err, stdout, stderr) ->
      expect(stdout).to.include(Fixtures.projectPath("e2e/static/does-not-exist.html"))
      expect(stdout).to.include("We failed looking for this file at the path:")
      expect(stdout).to.include("The internal Cypress web server responded with:")
      expect(stdout).to.include("> 404: Not Found")

    exec.on "close", (code) ->
      expect(code).to.eq(1)
      done()

  it "fails when content type isnt html", (done) ->
    @timeout(30000)

    exec = cp.exec "node index.js --run-project=#{e2ePath} --spec=cypress/integration/visit_non_html_content_type_failing_spec.coffee", {env: env}, (err, stdout, stderr) ->
      expect(stdout).to.include("The content-type of the response we received from this local file was:")
      expect(stdout).to.include("> text/plain")

    exec.on "close", (code) ->
      expect(code).to.eq(1)
      done()
