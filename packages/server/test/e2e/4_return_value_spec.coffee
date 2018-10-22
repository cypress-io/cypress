e2e = require("../support/helpers/e2e")

describe "e2e return value", ->
  e2e.setup()

  it "failing1", ->
    e2e.exec(@, {
      spec: "return_value_spec.coffee"
      snapshot: true
      expectedExitCode: 3
    })
