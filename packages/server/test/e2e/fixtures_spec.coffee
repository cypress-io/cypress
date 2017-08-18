e2e = require("../support/helpers/e2e")

describe "e2e fixtures", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      spec: "fixtures_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
