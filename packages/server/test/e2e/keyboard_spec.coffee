e2e = require("../support/helpers/e2e")

describe "e2e keyboard", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      spec: "keyboard_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
