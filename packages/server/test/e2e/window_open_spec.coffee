e2e = require("../support/helpers/e2e")

describe.skip "e2e window.open", ->
  e2e.setup()

  it "passes", ->
    e2e.start(@, {
      spec: "window_open_spec.coffee"
      expectedExitCode: 0
    })