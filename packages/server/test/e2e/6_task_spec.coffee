e2e = require("../support/helpers/e2e")

Fixtures = require("../support/helpers/fixtures")

describe "e2e task", ->
  e2e.setup()

  it "handles undefined return and includes stack trace in error", ->
    e2e.exec(@, {
      spec: "task_spec.coffee"
      snapshot: true
      expectedExitCode: 2
    })
    .then ({ stdout }) ->
      ## should include a stack trace from background file
      match = stdout.match(/at errors(.*)\n/)
      expect(match).not.to.be.null
      expect(match[0]).to.include("background/index.js")

  it "merges task events on subsequent registrations and logs warning for conflicts", ->
    e2e.exec(@, {
      project: Fixtures.projectPath("multiple-task-registrations")
      spec: "multiple_task_registrations_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
