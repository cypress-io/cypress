e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

describe "e2e task", ->
  e2e.setup()

  it "fails", ->
    e2e.exec(@, {
      project: Fixtures.projectPath("task-not-registered")
      spec: "task_not_registered_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
