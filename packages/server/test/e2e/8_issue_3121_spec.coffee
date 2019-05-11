e2e = require("../support/helpers/e2e")

describe "issue #3121", ->
  e2e.setup({
    servers: {
      port: 1653
    }
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "issue_3121_spec.coffee",
      snapshot: true,
      expectedExitCode: 0
    })