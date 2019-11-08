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
    e2e.exec(@, {
      spec: "config_passing_spec.coffee"
      snapshot: true
      expectedExitCode: 0
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
