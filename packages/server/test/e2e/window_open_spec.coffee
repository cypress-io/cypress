e2e = require("../support/helpers/e2e")

describe.skip "e2e window.open", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      spec: "window_open_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
