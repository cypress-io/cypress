e2e = require("../support/helpers/e2e")

describe "e2e keyboard", ->
  e2e.setup()

  it "passes", ->
    e2e.start(@, {
      spec: "keyboard_spec.coffee"
      expectedExitCode: 0
    })
