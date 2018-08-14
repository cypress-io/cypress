e2e = require("../support/helpers/e2e")

describe "e2e commands outside of test", ->
  e2e.setup()

  it "fails", ->
    e2e.exec(@, {
      spec: "commands_outside_of_test_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
