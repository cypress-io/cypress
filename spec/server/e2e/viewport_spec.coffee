e2e = require("../helpers/e2e")

describe "e2e viewport", ->
  e2e.setup({
    settings: {
      viewportWidth:  800
      viewportHeight: 600
    }
  })

  it "passes", ->
    e2e.start(@, {
      spec: "viewport_spec.coffee"
      debug: true
      expectedExitCode: 0
    })
