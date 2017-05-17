e2e = require("../support/helpers/e2e")

describe "e2e fixtures", ->
  e2e.setup()

  it "passes", ->
    e2e.start(@, {
      spec: "fixtures_spec.coffee"
      expectedExitCode: 0
    })