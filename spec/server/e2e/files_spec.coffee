e2e = require("../helpers/e2e")

describe "e2e files", ->

  e2e.setup()

  it "passes", ->
    e2e.start(@, {
      spec: "files_spec.coffee"
      expectedExitCode: 0
    })