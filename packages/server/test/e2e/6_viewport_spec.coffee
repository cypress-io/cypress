e2e = require("../support/helpers/e2e")

describe "e2e viewport", ->
  e2e.setup({
    settings: {
      viewportWidth:  800
      viewportHeight: 600
    }
  })

  e2e.it "passes", {
    spec: "viewport_spec.coffee"
    snapshot: true
    expectedExitCode: 0
  }
