require("../spec_helper")

_        = require("lodash")
fs       = require("fs-extra")
path     = require("path")
http     = require("http")
morgan   = require("morgan")
express  = require("express")
Promise  = require("bluebird")
sizeOf   = require("image-size")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")

fs     = Promise.promisifyAll(fs)
sizeOf = Promise.promisify(sizeOf)

app = express()

srv = http.Server(app)

app.use(morgan("dev"))

getHtml = (color) ->
  """
  <!DOCTYPE html>
  <html lang="en">
  <body>
    <div style="height: 2000px; width: 2000px; background-color: #{color};"></div>
  </body>
  </html>
  """

app.get "/color/:color", (req, res) ->
  res.set('Content-Type', 'text/html');

  res.send(getHtml(req.params.color))

fs = Promise.promisifyAll(fs)

startServer = ->
  new Promise (resolve) ->
    srv.listen 3322, ->
      console.log "listening on 3322"
      resolve()

stopServer = ->
  new Promise (resolve) ->
    srv.close(resolve)

describe "e2e screenshots", ->
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

    ## this tests that screenshots can be manually generated
    ## and are also generated automatically on failure with
    ## the test title as the file name

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/screenshots_spec.coffee"])
    .then =>
      expect(process.exit).to.be.calledWith(1)

      screenshot1 = path.join(@e2ePath, "cypress", "screenshots", "black.png")
      screenshot2 = path.join(@e2ePath, "cypress", "screenshots", "red.png")
      screenshot3 = path.join(@e2ePath, "cypress", "screenshots", "foo", "bar", "baz.png")
      screenshot4 = path.join(@e2ePath, "cypress", "screenshots", "generates pngs on failure.png")

      Promise.all([
        fs.statAsync(screenshot1).get("size")
        fs.statAsync(screenshot2).get("size")
        fs.statAsync(screenshot3).get("size")
        fs.statAsync(screenshot4).get("size")
      ])
      .then (sizes) ->
        ## make sure all of the values are unique
        expect(sizes).to.deep.eq(_.uniq(sizes))

        ## png1 should not be within 5k of png2
        expect(sizes[0]).not.to.be.closeTo(sizes[1], 5000)

        ## png3 should not be within 5k of png4
        expect(sizes[2]).not.to.be.closeTo(sizes[3], 5000)
      .then ->
        Promise.all([
          sizeOf(screenshot1)
          sizeOf(screenshot2)
          sizeOf(screenshot3)
          sizeOf(screenshot4)
        ])
      .then (dimensions = []) ->
        ## all of the images should be 1280x720
        ## since thats what we run headlessly
        _.each dimensions, (dimension) ->
          expect(dimension).to.deep.eq({width: 1280, height: 720, type: "png"})
