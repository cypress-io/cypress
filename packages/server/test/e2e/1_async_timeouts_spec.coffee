e2e = require("../support/helpers/e2e")

describe "e2e async timeouts", ->
  e2e.setup()

  it "failing1", ->
    e2e.exec(@, {
      spec: "async_timeouts_spec.coffee"
      snapshot: true
      expectedExitCode: 2
    })
