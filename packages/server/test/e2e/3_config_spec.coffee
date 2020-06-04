e2e = require("../support/helpers/e2e").default
Fixtures = require("../support/helpers/fixtures")

configWithInvalidViewport = Fixtures.projectPath("config-with-invalid-viewport")
configWithInvalidBrowser = Fixtures.projectPath("config-with-invalid-browser")

describe "e2e config", ->
  e2e.setup({
    settings: {
      ## force the default command timeout to be
      ## much lower which causes our test to fail
      defaultCommandTimeout: 1000
    }
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "config_passing_spec.coffee"
      snapshot: true
      config: {
        env: {
          scriptlet: "<script>alert('this should not break')</script>"
        }
      }
    })

  it "fails", ->
    ## this tests that config is applied correctly
    ## from modified cypress.json

    ## TODO: test that environment variables and CYPRESS_config
    ## work as well

    e2e.exec(@, {
      spec: "config_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })

  it "catches invalid viewportWidth in the configuration file", ->
    # the test project has cypress.json with a bad setting
    # which should show an error and exit
    e2e.exec(@, {
      project: configWithInvalidViewport
      expectedExitCode: 1
      snapshot: true
    })

  it "catches invalid browser in the configuration file", ->
    # the test project has cypress.json with a bad browser
    # which should show an error and exit
    e2e.exec(@, {
      project: configWithInvalidBrowser
      expectedExitCode: 1
      snapshot: true
    })
