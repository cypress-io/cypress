e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")
snapshot = require("snap-shot-it")

describe "e2e component tests", ->
  e2e.setup()

  project = Fixtures.projectPath("component-tests")

  it "runs just the integration spec file", ->
    e2e.exec(@, {
      project,
      spec: "integration-spec.js",
      config: {
        video: false
      }
    })
    .then (result) ->
      runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))
      snapshot('integration spec run', runSummary)

  # TODO GB write the tests for component tests feature
  it "runs component spec file"

  it "runs integration and component spec file when running all tests", ->
    e2e.exec(@, {
      project,
      config: {
        video: false
      }
    })
    .then (result) ->
      runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))
      snapshot('all tests results summary', runSummary)
