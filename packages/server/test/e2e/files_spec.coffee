e2e = require("../support/helpers/e2e")

describe "e2e files", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      spec: "files_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
