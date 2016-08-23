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
  "localhost:2220": 0
  "localhost:2221": 0
  "localhost:2222": 0
  "localhost:2223": 0
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
    when "localhost:2220"
      res
      .cookie("2220", true, {
        path: "/cookies/one"
      })
      .redirect("http://localhost:2221/")

    when "localhost:2221"
      res
      .cookie("2221", true, {
        path: "/cookies/two"
      })
      .redirect("http://localhost:2222/")

    when "localhost:2222"
      res
      .set('Content-Type', 'text/html')
      .cookie("2222", true, {
        path: "/cookies/three"
      })
      .send("<html><head></head><body>hi</body></html>")

    when "localhost:2223"
      res
      .cookie("2223", true, {
        httpOnly: true
        maxAge: 60000
      })
      .cookie("2223-session", true)
      .send({})

fs = Promise.promisifyAll(fs)

startServers = ->
  start = (port, i) ->
    new Promise (resolve) ->
      servers[i].listen port, ->
        console.log "listening on port: #{port}"
        resolve()

  Promise.map([2220, 2221, 2222, 2223], start)

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
