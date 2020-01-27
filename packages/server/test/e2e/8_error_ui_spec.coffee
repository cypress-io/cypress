e2e = require("../support/helpers/e2e")

describe "e2e reporters", ->
  e2e.setup()

  it "displays code frame for errors", ->
    e2e.exec(@, {
      spec: "various_failures_spec.js"
      expectedExitCode: 27
    })
