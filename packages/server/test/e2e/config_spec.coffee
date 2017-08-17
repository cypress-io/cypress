e2e = require("../support/helpers/e2e")

describe "e2e config", ->
  e2e.setup({
    settings: {
      ## force the default command timeout to be
      ## much lower which causes our test to fail
      defaultCommandTimeout: 1000
    }
  })

  it "passes", ->
    e2e.start(@, {
      spec: "config_passing_spec.coffee"
      expectedExitCode: 0
    })

  it "fails", ->
    ## this tests that config is applied correctly
    ## from modified cypress.json

    ## TODO: test that environment variables and CYPRESS_config
    ## work as well

    e2e.exec(@, {
      spec: "config_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).not.to.include("1 passing")
      expect(stdout).to.include("CypressError: Timed out retrying: Expected to find element: '#bar', but never found it.")
