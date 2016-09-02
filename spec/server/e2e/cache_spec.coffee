require("../spec_helper")

fs         = require("fs")
path       = require("path")
http       = require("http")
morgan     = require("morgan")
express    = require("express")
Fixtures   = require("../helpers/fixtures")
user       = require("#{root}lib/user")
cypress    = require("#{root}lib/cypress")
Project    = require("#{root}lib/project")

replacerRe = /(<h1>)\w+(<\/h1>)/

e2ePath = Fixtures.projectPath("e2e")

app = express()

srv = http.Server(app)

app.use(morgan("dev"))
app.use(express.static(e2ePath, {
  ## force caching to happen
  maxAge: 3600000
}))

app.post "/write/:text", (req, res) ->
  file = path.join(e2ePath, "index.html")

  fs.readFile file, "utf8", (err, str) ->
    ## replace the word between <h1>...</h1>
    str = str.replace(replacerRe, "$1#{req.params.text}$2")

    fs.writeFile file, str, (err) ->
      res.sendStatus(200)

startServer = ->
  new Promise (resolve) ->
    srv.listen 1515, ->
      console.log "listening on 1515"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e cache", ->
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

    cypress.start(["--run-project=#{e2ePath}", "--spec=cypress/integration/cache_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
