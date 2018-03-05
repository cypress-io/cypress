e2e = require("../support/helpers/e2e")

describe "e2e task", ->
  it "fails", ->
    e2e.exec(@, {
      spec: "task_not_registered_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
