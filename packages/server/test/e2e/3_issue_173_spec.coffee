e2e = require("../support/helpers/e2e")

describe "e2e issue 173", ->
  e2e.setup()

  ## https://github.com/cypress-io/cypress/issues/173

  it "failing", ->
    e2e.exec(@, {
      spec: "issue_173_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
