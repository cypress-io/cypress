e2e = require("../support/helpers/e2e")

describe "e2e issue 3658", ->
  e2e.setup()

  ## https://github.com/cypress-io/cypress/issues/3658

  it "passes", ->
    e2e.exec(@, {
      spec: "issue_3658_spec.js"
      snapshot: true
      expectedExitCode: 0
    })
