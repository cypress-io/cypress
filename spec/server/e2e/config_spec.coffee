require("../spec_helper")

_        = require("lodash")
cp       = require("child_process")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")
settings = require("#{root}lib/util/settings")

env = _.omit(process.env, "CYPRESS_DEBUG")

describe "e2e config", ->
  beforeEach ->
    Fixtures.scaffold()

    @e2ePath = Fixtures.projectPath("e2e")

    @sandbox.stub(process, "exit")

    user.set({name: "brian", session_token: "session-123"})
    .then =>
      Project.add(@e2ePath)
    .then =>
      settings.write(@e2ePath, {
        ## force the default command timeout to be
        ## much lower which causes our test to fail
        defaultCommandTimeout: 1000
      })

  afterEach ->
    # Fixtures.remove()

  it "fails", (done) ->
    @timeout(30000)

    ## this tests that config is applied correctly
    ## from modified cypress.json

    ## TODO: test that environment variables and CYPRESS_config
    ## work as well

    exec = cp.exec "node index.js --run-project=#{@e2ePath} --spec=cypress/integration/config_failing_spec.coffee", {env: env}, (err, stdout, stderr) ->
      expect(stdout).not.to.include("1 passing")
      expect(stdout).to.include("CypressError: Timed out retrying: Expected to find element: '#bar', but never found it.")

    exec.on "close", (code) ->
      expect(code).to.eq(1)
      done()