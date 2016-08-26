require("../spec_helper")

fs       = require("fs-extra")
path     = require("path")
Promise  = require("bluebird")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")

fs = Promise.promisifyAll(fs)

describe "e2e screenshots", ->
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

    ## this tests that screenshots can be manually generated
    ## and are also generated automatically on failure with
    ## the test title as the file name

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/screenshots_spec.coffee"])
    .then =>
      expect(process.exit).to.be.calledWith(1)

      screenshot1 = path.join(@e2ePath, "cypress", "screenshots", "foo", "bar", "baz.png")
      screenshot2 = path.join(@e2ePath, "cypress", "screenshots", "generates pngs on failure.png")

      Promise.all([
        fs.statAsync(screenshot1)
        fs.statAsync(screenshot2)
      ])