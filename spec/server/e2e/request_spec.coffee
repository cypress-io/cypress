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

servers = [
  http.Server(app)
  http.Server(app)
  http.Server(app)
  http.Server(app)
]

counts = {
  "localhost:2290": 0
  "localhost:2291": 0
  "localhost:2292": 0
  "localhost:2293": 0
}

app.use(morgan("dev"))
app.use(parser())

app.get "/cookies*", (req, res) ->
  res.json(req.cookies)

app.get "/counts", (req, res) ->
  res.json(counts)

app.get "*", (req, res) ->

  host = req.get("host")

  counts[host] += 1

  switch host
    when "localhost:2290"
      res
      .cookie("2290", true, {
        path: "/cookies/one"
      })
      .redirect("http://localhost:2291/")

    when "localhost:2291"
      res
      .cookie("2291", true, {
        path: "/cookies/two"
      })
      .redirect("http://localhost:2292/")

    when "localhost:2292"
      res
      .set('Content-Type', 'text/html')
      .cookie("2292", true, {
        path: "/cookies/three"
      })
      .send("<html><head></head><body>hi</body></html>")

    when "localhost:2293"
      res
      .cookie("2293", true, {
        httpOnly: true
        maxAge: 60000
      })
      .cookie("2293-session", true)
      .send({})

fs = Promise.promisifyAll(fs)

startServers = ->
  start = (port, i) ->
    new Promise (resolve) ->
      servers[i].listen port, ->
        console.log "listening on port: #{port}"
        resolve()

  Promise.map([2290, 2291, 2292, 2293], start)

stopServers = ->
  stop = (server) ->
    new Promise (resolve) ->
      server.close(resolve)

  Promise.map(servers, stop)

describe "e2e requests", ->
  beforeEach ->
    Fixtures.scaffold()

    @e2ePath = Fixtures.projectPath("e2e")

    @sandbox.stub(process, "exit")

    user.set({name: "brian", session_token: "session-123"})
    .then =>
      Project.add(@e2ePath)
    .then =>
      startServers()

  afterEach ->
    Fixtures.remove()

    stopServers()

  it "passes", ->
    @timeout(20000)

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/request_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
