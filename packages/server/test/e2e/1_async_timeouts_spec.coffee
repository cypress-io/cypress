e2e = require("../support/helpers/e2e")

describe "e2e async timeouts", ->
  e2e.setup()

  ## FIREFOX FIXME: error is slightly different and stack track line isn't replaced in snapshot
  it "failing1", ->
    e2e.exec(@, {
      spec: "async_timeouts_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
