e2e = require("../support/helpers/e2e")

describe "e2e promises", ->
  e2e.setup()

  it "failing1", ->
    e2e.exec(@, {
      spec: "promises_spec.coffee"
      snapshot: true
      expectedExitCode: 2
    })
