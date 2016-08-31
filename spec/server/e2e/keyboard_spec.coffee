require("../spec_helper")

Fixtures   = require("../helpers/fixtures")
user       = require("#{root}lib/user")
cypress    = require("#{root}lib/cypress")
Project    = require("#{root}lib/project")

describe "e2e keyboard", ->
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
    @timeout(2000000)

    cypress.start(["--run-project=#{@e2ePath}", "--spec=cypress/integration/keyboard_spec.coffee"])
    .then ->
      expect(process.exit).to.be.calledWith(0)
