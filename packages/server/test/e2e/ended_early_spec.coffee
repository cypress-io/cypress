e2e = require("../support/helpers/e2e")

describe "e2e ended early", ->
  e2e.setup()

  it "failing", ->
    e2e.exec(@, {
      spec: "ended_early_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
