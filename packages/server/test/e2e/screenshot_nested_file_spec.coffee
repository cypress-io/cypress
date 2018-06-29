e2e = require("../support/helpers/e2e")

describe "e2e screenshot in nested spec", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      spec: "nested-1/nested-2/screenshot_nested_file_spec.coffee"
      expectedExitCode: 0
      snapshot: true
    })
