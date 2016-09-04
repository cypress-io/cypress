require("../spec_helper")

_        = require("lodash")
fs       = require("fs-extra")
cors     = require("cors")
http     = require("http")
morgan   = require("morgan")
parser   = require("cookie-parser")
express  = require("express")
session  = require("express-session")
Promise  = require("bluebird")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")

app = express()

srv = http.Server(app)

app.use(morgan("dev"))
app.use(parser())

getIndex = ->
  """
  <!DOCTYPE html>
  <html>
  <head>
  </head>
  <body>
    <ul>
      <li>
        <a href="http://help.foobar.com:2292">switch to http://help.foobar.com</a>
      </li>
    </ul>
  </body>
  </html>
  """

getText = (text) ->
  """
  <!DOCTYPE html>
  <html>
  <head>
  </head>
  <body>
    <h1>#{text}</h1>
  </body>
  </html>
  """

applySession = session({
  name: "secret-session"
  secret: "secret"
  cookie: {
    sameSite: true
  }
})

app.get "/cookies*", cors({origin: true, credentials: true}), (req, res) ->
  res.json({
    cookie: req.headers["cookie"]
    parsed: req.cookie
  })

app.get "*", (req, res, next) ->
  res.set('Content-Type', 'text/html');

  getHtml = =>
    switch h = req.get("host")
      when "www.foobar.com:2292"
        getIndex()

      when "help.foobar.com:2292"
        getText("Help")

      when "session.foobar.com:2292"
        applySession(req, res, next)

        getText("Session")

      when "domain.foobar.com:2292"
        res.cookie("nomnom", "good", {
          name: "domain-cookie"
          domain: ".foobar.com"
        })

        getText("Domain")

      else
        throw new Error("Host: '#{h}' not recognized")

  res.send(getHtml())

fs = Promise.promisifyAll(fs)

startServer = ->
  new Promise (resolve) ->
    srv.listen 2292, ->
      console.log "listening on 2292"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e subdomain", ->
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

    cypress.start(["--run-project=#{@e2ePath}", "--hosts=*.foobar.com=127.0.0.1", "--spec=cypress/integration/subdomain_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
