e2e = require("../support/helpers/e2e")

describe "e2e reporters", ->
  e2e.setup()

  it "displays correct UI for errors", ->
    e2e.exec(@, {
      spec: "various_failures_spec.js"
      expectedExitCode: 15
    })

  it "displays correct UI for errors in custom commands", ->
    e2e.exec(@, {
      spec: "various_failures_custom_commands_spec.js"
      expectedExitCode: 15
    })
