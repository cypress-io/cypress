e2e = require("../support/helpers/e2e")

describe "e2e issue 674", ->
  e2e.setup()

  ## https://github.com/cypress-io/cypress/issues/674

  it "fails", ->
    e2e.exec(@, {
      spec: "issue_674_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
