e2e = require("../support/helpers/e2e")

describe "e2e issue 4062", ->
  e2e.setup()

  ## https://github.com/cypress-io/cypress/issues/4062

  it "fails", ->
    e2e.exec(@, {
      spec: "issue_4062_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
